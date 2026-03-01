import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import React from 'react'

interface PreviewProps {
  vertices: Float32Array
  indices: Uint32Array
}

export const Preview: React.FC<PreviewProps> = ({ vertices, indices }) => {
  return (
    <Canvas camera={{ position: [150, 150, 150], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 50, 50]} intensity={1} />
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[vertices, 3]} // vertices array, itemSize
          />
          <bufferAttribute
            attach="index"
            args={[indices, 1]} // indices array, itemSize
          />
        </bufferGeometry>
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
    </Canvas>
  )
}