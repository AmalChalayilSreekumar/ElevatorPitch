// Frees the GPU resources under root and detaches it. Module-level geometries and materials shared between
// builds are safe to include: Three.js re-uploads a disposed resource the next time it is rendered.
export function disposeObject(root) {
  const disposed = new Set();
  const release = (resource) => {
    if (!resource || disposed.has(resource)) return;
    disposed.add(resource);
    if (resource.isVideoTexture) stopVideo(resource.image);
    resource.dispose();
  };

  root.traverse((object) => {
    release(object.geometry);
    for (const material of [object.material ?? []].flat()) {
      for (const value of Object.values(material)) if (value?.isTexture) release(value);
      release(material);
    }
    if (object.isInstancedMesh || object.isLight) object.dispose();
  });
  root.removeFromParent();
}

// Pausing alone keeps the decoder and download alive; dropping the source releases both.
function stopVideo(video) {
  video.pause();
  video.removeAttribute('src');
  video.load();
}
