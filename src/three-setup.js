// Selective Three.js imports — only what grid-scene.js uses
// Vite tree-shakes everything else (~600KB → ~200KB)
import {
  Scene, PerspectiveCamera, WebGLRenderer,
  BufferGeometry, BufferAttribute, ShaderMaterial,
  Points, LineBasicMaterial, Line, LineSegments, LineLoop,
  MeshBasicMaterial, Mesh,
  RingGeometry, CircleGeometry, PlaneGeometry, ShapeGeometry,
  Raycaster, Vector2, Vector3, Plane,
  CanvasTexture, SpriteMaterial, Sprite,
  Group, Shape, EllipseCurve, CubicBezierCurve3,
  AdditiveBlending, DoubleSide, LinearFilter
} from 'three';

// Expose as global THREE for grid-scene.js compatibility
window.THREE = {
  Scene, PerspectiveCamera, WebGLRenderer,
  BufferGeometry, BufferAttribute, ShaderMaterial,
  Points, LineBasicMaterial, Line, LineSegments, LineLoop,
  MeshBasicMaterial, Mesh,
  RingGeometry, CircleGeometry, PlaneGeometry, ShapeGeometry,
  Raycaster, Vector2, Vector3, Plane,
  CanvasTexture, SpriteMaterial, Sprite,
  Group, Shape, EllipseCurve, CubicBezierCurve3,
  AdditiveBlending, DoubleSide, LinearFilter
};
