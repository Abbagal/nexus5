import type { Material, WebGLProgramParametersWithUniforms } from "three";

/** 1 = full surface detail, 0 = plain paper (ontology / diagram sections). */
export const surfaceDetail = { value: 1 };

const NOISE = /* glsl */ `
varying vec3 vSurfPos;
varying vec3 vSurfNormal;
uniform float uSurfDetail;
float surfHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float surfNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(surfHash(i), surfHash(i + vec2(1.0, 0.0)), u.x),
             mix(surfHash(i + vec2(0.0, 1.0)), surfHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

type Kind = "cladding" | "concrete" | "ground" | "paint" | "metal";

const FRAGMENT_COLOR: Record<Kind, string> = {
  cladding: /* glsl */ `
    {
      float lift = smoothstep(0.0, 1.6, vSurfPos.y);
      float mottle = surfNoise(vSurfPos.xz * 0.45 + vSurfPos.y * 0.3);
      float shade = mix(0.93, 1.0, lift) * (1.0 + (mottle - 0.5) * 0.035);
      diffuseColor.rgb *= mix(1.0, shade, uSurfDetail);
    }
  `,
  concrete: /* glsl */ `
    {
      vec2 p = vSurfPos.xz;
      float n = surfNoise(p * 0.32) * 0.55 + surfNoise(p * 1.6) * 0.3 + surfNoise(p * 7.0) * 0.15;
      float up = step(0.7, normalize(vSurfNormal).y);
      vec2 g = abs(fract(p / 4.0 + 0.5) - 0.5) * 4.0;
      float line = min(g.x, g.y);
      float fw = fwidth(p.x) + fwidth(p.y);
      float joint = (1.0 - smoothstep(0.012, 0.012 + fw * 1.4, line)) * (1.0 - smoothstep(0.05, 0.16, fw)) * up;
      float shade = (1.0 + (n - 0.5) * 0.07) * (1.0 - joint * 0.1);
      diffuseColor.rgb *= mix(1.0, shade, uSurfDetail);
    }
  `,
  ground: /* glsl */ `
    {
      vec2 p = vSurfPos.xz;
      float n = surfNoise(p * 0.06) * 0.6 + surfNoise(p * 0.4) * 0.3 + surfNoise(p * 2.2) * 0.1;
      float d = length(p);
      float site = 1.0 - smoothstep(60.0, 120.0, d);
      float shade = 1.0 + (n - 0.5) * 0.045 * site;
      diffuseColor.rgb *= mix(1.0, shade, uSurfDetail);
    }
  `,
  paint: /* glsl */ `
    {
      vec3 wn = normalize(vSurfNormal);
      float peel = surfNoise(vSurfPos.xy * 14.0 + vSurfPos.z * 9.0);
      float hoop = abs(fract(vSurfPos.y * 0.85) - 0.5);
      float band = (1.0 - smoothstep(0.468, 0.5, hoop)) * step(0.35, 1.0 - abs(wn.y));
      float ang = atan(vSurfPos.x, vSurfPos.z);
      float weld = (1.0 - smoothstep(0.0, 0.035, abs(sin(ang * 2.0)))) * step(0.45, 1.0 - abs(wn.y));
      float shade = 1.0 + (peel - 0.5) * 0.045 - band * 0.055 - weld * 0.04;
      shade *= mix(0.96, 1.0, smoothstep(0.0, 2.4, vSurfPos.y));
      diffuseColor.rgb *= mix(1.0, shade, uSurfDetail);
    }
  `,
  metal: /* glsl */ `
    {
      float grain = surfNoise(vSurfPos.xy * 22.0 + vSurfPos.z * 16.0);
      float streak = surfNoise(vec2(vSurfPos.y * 8.0, vSurfPos.x * 0.4 + vSurfPos.z * 0.4));
      float shade = 1.0 + (grain - 0.5) * 0.05 + (streak - 0.5) * 0.03;
      diffuseColor.rgb *= mix(1.0, shade, uSurfDetail);
    }
  `,
};

const FRAGMENT_NORMAL: Record<Kind, string> = {
  cladding: /* glsl */ `
    {
      vec3 wn = normalize(vSurfNormal);
      if (abs(wn.y) < 0.5) {
        vec3 along = abs(wn.z) > abs(wn.x) ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
        float coord = dot(vSurfPos, along);
        float fw = fwidth(coord);
        float fade = (1.0 - smoothstep(0.035, 0.09, fw)) * uSurfDetail;
        float wave = sin(coord * 6.2831853 / 0.22);
        vec3 tangentView = normalize((viewMatrix * vec4(along, 0.0)).xyz);
        normal = normalize(normal + tangentView * wave * 0.28 * fade);
      }
    }
  `,
  concrete: "",
  ground: "",
  paint: "",
  metal: /* glsl */ `
    {
      vec3 along = abs(vSurfNormal.y) > 0.7 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
      float coord = dot(vSurfPos, along);
      float wave = sin(coord * 40.0) * 0.08 * uSurfDetail;
      vec3 tangentView = normalize((viewMatrix * vec4(along, 0.0)).xyz);
      normal = normalize(normal + tangentView * wave);
    }
  `,
};

export function withSurface<T extends Material>(material: T, kind: Kind): T {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uSurfDetail = surfaceDetail;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSurfPos;\nvarying vec3 vSurfNormal;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSurfPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvSurfNormal = normalize(mat3(modelMatrix) * objectNormal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_COLOR[kind]}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${FRAGMENT_NORMAL[kind]}`);
  };
  material.customProgramCacheKey = () => `surface-${kind}`;
  material.needsUpdate = true;
  return material;
}
