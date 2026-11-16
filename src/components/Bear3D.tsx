import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * The 3D teddy for "Feed the bear".
 *
 * One bear (renderer + model + animation state) is shared and lives outside React, so it keeps
 * animating when the game swaps rounds (the board remounts every round). <Bear3D /> just parks
 * its canvas inside the target box; the game talks to it with `bearCue(...)`.
 */

export type BearCue = 'ask' | 'idle' | 'eat' | 'wrong';
type Clip = 'Idle' | 'Ask' | 'Eat' | 'Happy' | 'Yummy' | 'Grumpy' | 'Sad';

const MODEL_URL = './models/lexino_bear.glb';

/** What follows each clip: [next clip, seconds to hold it]. Non-looping clips move on when they end. */
const THEN: Partial<Record<Clip, [Clip, number]>> = {
  Eat: ['Happy', 0],
  Happy: ['Yummy', 2.6], // 2 jumps
  Yummy: ['Idle', 2],
  Grumpy: ['Sad', 0],
  Sad: ['Idle', 4],
};
const ONCE: Clip[] = ['Eat', 'Grumpy'];
const FADE = 0.25;

class BearScene {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  private mixer: THREE.AnimationMixer | null = null;
  private actions = new Map<Clip, THREE.AnimationAction>();
  private clock = new THREE.Clock();
  private current: Clip = 'Idle';
  private clipEnd = Infinity; // time (clock seconds) at which the current clip hands over to the next one
  private raf = 0;
  private running = false;
  private disposed = false;
  private pending: BearCue | null = null;
  private w = 0;
  private h = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'bear3d__canvas';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c6a8, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1.5, 3, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff1dd, 0.7);
    fill.position.set(-3, 1.5, 2);
    this.scene.add(fill);

    // Frame the whole bear incl. the height of its jump (Happy) and its widest pose (arms out).
    this.camera.position.set(0, 1.17, 4.7);
    this.camera.lookAt(0, 1.17, 0);

    new GLTFLoader().load(MODEL_URL, (gltf) => {
      if (this.disposed) return;
      const model = gltf.scene;
      this.scene.add(model);
      this.mixer = new THREE.AnimationMixer(model);
      for (const clip of gltf.animations) {
        const a = this.mixer.clipAction(clip);
        if (ONCE.includes(clip.name as Clip)) {
          a.setLoop(THREE.LoopOnce, 1);
          a.clampWhenFinished = true;
        }
        this.actions.set(clip.name as Clip, a);
      }
      this.play('Idle', true);
      if (this.pending) { const p = this.pending; this.pending = null; this.cue(p); }
      this.render();
    });
  }

  /** Cross-fade to a clip and schedule what comes after it. */
  private play(name: Clip, instant = false) {
    const next = this.actions.get(name);
    if (!next) return;
    const prev = this.actions.get(this.current);
    next.reset().play();
    if (prev && prev !== next && !instant) next.crossFadeFrom(prev, FADE, false);
    else if (prev && prev !== next) prev.stop();
    this.current = name;
    const then = THEN[name];
    const t = this.clock.elapsedTime;
    this.clipEnd = then ? t + (then[1] || next.getClip().duration) : Infinity;
  }

  /** The game tells the bear what just happened. Eating / grumping can't be interrupted by a mere "ask". */
  cue(c: BearCue) {
    if (!this.mixer) { this.pending = c; return; }
    const busy = this.current === 'Eat' || this.current === 'Grumpy';
    if (c === 'eat') this.play('Eat');
    else if (c === 'wrong') this.play('Grumpy');
    else if (c === 'ask') { if (!busy && this.current !== 'Ask') this.play('Ask'); }
    else if (this.current === 'Ask') this.play('Idle'); // dragged item let go without feeding
  }

  resize(w: number, h: number) {
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the same vertical field of view for the bear's width on narrow boxes
    this.camera.fov = w / h < 0.75 ? 30 / (w / h / 0.75) : 30;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.getDelta();
    const tick = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      const dt = Math.min(this.clock.getDelta(), 0.1);
      if (this.mixer) {
        this.mixer.update(dt);
        const then = THEN[this.current];
        if (then) {
          const a = this.actions.get(this.current);
          const done = ONCE.includes(this.current) ? !!a && a.time >= a.getClip().duration - 0.02 : this.clock.elapsedTime >= this.clipEnd;
          if (done) this.play(then[0]);
        }
      }
      this.render();
    };
    tick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private render() {
    if (this.w) this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}

let shared: BearScene | null = null;
let mounts = 0;
let killTimer = 0;

function getBear() {
  if (!shared) shared = new BearScene();
  return shared;
}

/** Tell the bear what is happening (no-op if the 3D bear isn't on screen). */
export function bearCue(c: BearCue) {
  shared?.cue(c);
}

export function Bear3D({ label = 'bear' }: { label?: string }) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    window.clearTimeout(killTimer);
    mounts++;
    const bear = getBear();
    el.appendChild(bear.canvas);
    const fit = () => bear.resize(el.clientWidth, el.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    bear.start();
    return () => {
      ro.disconnect();
      mounts--;
      // the next round mounts a new <Bear3D/> right away; only tear down if nobody does
      killTimer = window.setTimeout(() => {
        if (mounts > 0) return;
        shared?.dispose();
        shared = null;
      }, 1500);
      if (mounts === 0) bear.stop();
    };
  }, []);

  return <span ref={host} className="bear3d" role="img" aria-label={label} />;
}
