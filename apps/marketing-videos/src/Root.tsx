import { Composition } from 'remotion';
import { BrandIntro } from './compositions/BrandIntro';
import { VIDEO } from './theme';

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="BrandIntro"
        component={BrandIntro}
        durationInFrames={VIDEO.fps * 5}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
}
