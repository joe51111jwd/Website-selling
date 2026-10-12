import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export type ScreenSource = string | HTMLVideoElement | HTMLCanvasElement | null | undefined;

const isVideo = (src: string) => /\.(mp4|webm|mov)(\?|$)/i.test(src);

/**
 * Loads an image or video for a device screen and fits it to the screen's aspect.
 * "cover" crops like CSS object-fit (anchored by `align`: 0 = top, 1 = bottom). "width" keeps
 * the full width of a wider image (a web-app screenshot) and runs its bottom edge on down.
 */
export function useScreenTexture(src: ScreenSource, aspect: number, align = 0, fit: "cover" | "width" = "cover") {
  const gl = useThree((s) => s.gl);
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!src) return setTex(null);
    let t: THREE.Texture;
    let gone = false;
    if (typeof src !== "string") {
      t = src instanceof HTMLVideoElement ? new THREE.VideoTexture(src) : new THREE.CanvasTexture(src);
      setTex(t);
    } else if (isVideo(src)) {
      const v = document.createElement("video");
      Object.assign(v, { src, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous", autoplay: true });
      v.play().catch(() => {});
      t = new THREE.VideoTexture(v);
      setTex(t);
    } else {
      t = new THREE.TextureLoader().load(src, () => !gone && setTex(t.clone()));
    }
    return () => {
      gone = true;
      t.dispose();
    };
  }, [src]);

  return useMemo(() => {
    if (!tex) return null;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = gl.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = !(tex instanceof THREE.VideoTexture);
    tex.minFilter = tex.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    const img = tex.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number } | undefined;
    const iw = img?.videoWidth || img?.width || 1;
    const ih = img?.videoHeight || img?.height || 1;
    const ia = iw / ih;
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    if (ia > aspect && fit === "width") {
      tex.repeat.y = ia / aspect;
      tex.offset.y = 1 - tex.repeat.y;
    } else if (ia > aspect) {
      tex.repeat.x = aspect / ia;
      tex.offset.x = (1 - tex.repeat.x) / 2;
    } else if (ia < aspect) {
      tex.repeat.y = ia / aspect;
      tex.offset.y = (1 - tex.repeat.y) * (1 - align);
    }
    tex.needsUpdate = true;
    return tex;
  }, [tex, aspect, align, fit, gl]);
}

/** Screen surface: shows its image unlit and true to colour, with a faint glass sheen on top. */
export function screenMaterial(map: THREE.Texture | null) {
  return new THREE.MeshPhysicalMaterial({
    color: "#000",
    emissive: map ? "#fff" : "#000",
    emissiveMap: map,
    roughness: 0.18,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    toneMapped: false,
  });
}
