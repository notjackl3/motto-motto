export default function SkyAndLighting() {
  // TODO: skybox / sun position driven by time of day
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
    </>
  );
}
