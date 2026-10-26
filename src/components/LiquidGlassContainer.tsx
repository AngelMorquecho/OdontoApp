import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  BackdropFilter,
  Blur,
  Rect,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';

interface Props {
  children: React.ReactNode;
  height?: number;
}

export const LiquidGlassContainer: React.FC<Props> = ({
  children,
  height = 70,
}) => {
  return (
    <View style={[styles.shadowContainer, { height }]}>
      <View style={styles.container}>
        {/* Cristal líquido esmerilado */}
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <BackdropFilter
            filter={<Blur blur={24} mode="clamp" />}
            clip={{ x: 0, y: 0, width: 2000, height: height }}>
            {/* Tinte base azul clínico equilibrado */}
          <Rect
  x={0}
  y={0}
  width={2000}
  height={height}
  color="rgb(32, 159, 250)" // Base azul frío/glacial
/>
          </BackdropFilter>

          {/* Gradiente de brillo especular superior */}
          <Rect x={0} y={0} width={2000} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
             colors={[
      'rgba(189, 219, 245, 0.75)', // Destello helado brillante (Alice Blue)
      'rgba(147, 197, 230, 0.65)', // Azul frío intermedio suave
      'rgba(43, 91, 132, 0.90)',   // Azul acero frío profundo en la base
    ]}
              positions={[0, 0.45, 1]}
            />
          </Rect>
        </Canvas>

        {/* Borde especular superior */}
        <View pointerEvents="none" style={styles.topHighlight} />

        {/* Contorno interior de cristal */}
        <View pointerEvents="none" style={styles.innerBorder} />

        {/* Elementos de la interfaz */}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    width: '100%',
    borderRadius: 35,
    // Sombra flotante azul marino
    shadowColor: '#4b91dd',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 12,
  },

  container: {
    
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'transparent',
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 1,
    zIndex: 2,
  },

  innerBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    zIndex: 2,
  },

  content: {
    flex: 1,
    zIndex: 3,
  },
});