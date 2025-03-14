import * as d3 from "d3";

import { FILL_METHOD, SEAM_OVERLAP } from "./constants";
import { fillTriTex } from "./fillTriTex";
import { forwardProjectionMatrixForPoints } from "./forwardProjectionMatrixForPoints";
import { projectPoint } from "./projectPoint";

// See figure: https://github.com/bschwind/Face-Squash
const lerpQuad = (quad) => {
  const p01 = d3.interpolate(quad[0], quad[1]);
  const p32 = d3.interpolate(quad[3], quad[2]);

  return (s, t) => d3.interpolate(p01(s), p32(s))(t);
};

// return the triangles to fill the cell at the given row/column
const rowColTris = (
  row: number,
  col: number,
  {
    lerp,
    projection,
  }: { lerp?: (c: any, r: any) => any; projection?: () => any },
  tiles: number
): { x: number; y: number }[][] => {
  const pad = SEAM_OVERLAP; // we add padding to remove tile seams
  let p: Function;

  if (lerp) {
    p = (r, c) => lerp(c / tiles, r / tiles);
  }

  if (projection) {
    p = (r, c) => projectPoint({ x: c / tiles, y: r / tiles }, projection);
  }

  return [
    /*
    0-----1
     \    |
       \  |  top
         \|
          2
    */
    [
      p(row - pad, col - pad * 2), // extra diagonal padding
      p(row - pad, col + 1 + pad),
      p(row + 1 + pad * 2, col + 1 + pad), // extra diagonal padding
    ],
    /*
    2
    |\
    |  \   bottom
    |    \
    1-----0
    */
    [
      p(row + 1 + pad, col + 1 + pad),
      p(row + 1 + pad, col - pad),
      p(row - pad, col - pad),
    ],
  ];
};

const fillQuadTex = (
  ctx: CanvasRenderingContext2D,
  src: {
    x: number;
    y: number;
  }[],
  dst: {
    x: number;
    y: number;
  }[],
  opts: { tiles?: number; method?: string } = {}
): void => {
  const tiles = opts.tiles || 10;
  const method = opts.method || FILL_METHOD.BILINEAR; // or perspective

  const lerpSrc = lerpQuad(src);
  const lerpDst = lerpQuad(dst);

  const projectionSrc = forwardProjectionMatrixForPoints(src);
  const projectionDst = forwardProjectionMatrixForPoints(dst);

  // clip to erase the external padding
  ctx.save();
  ctx.beginPath();
  for (let i = 0, len = dst.length; i < len; ++i) {
    ctx.lineTo(dst[i].x, dst[i].y);
  }
  ctx.closePath();
  ctx.clip();

  // draw triangles
  for (let r = 0; r < tiles; ++r) {
    for (let c = 0; c < tiles; ++c) {
      let srcTop: { x: number; y: number }[];
      let srcBot: { x: number; y: number }[];
      let dstTop: { x: number; y: number }[];
      let dstBot: { x: number; y: number }[];

      switch (method) {
        case FILL_METHOD.BILINEAR: {
          [srcTop, srcBot] = rowColTris(r, c, { lerp: lerpSrc }, tiles);
          [dstTop, dstBot] = rowColTris(r, c, { lerp: lerpDst }, tiles);
          break;
        }

        case FILL_METHOD.PERSPECTIVE: {
          [srcTop, srcBot] = rowColTris(
            r,
            c,
            { projection: projectionSrc },
            tiles
          );
          [dstTop, dstBot] = rowColTris(
            r,
            c,
            { projection: projectionDst },
            tiles
          );
          break;
        }

        default:
          throw new Error(`Unknown fill method ${method}`);
      }

      fillTriTex(ctx, srcTop, dstTop);
      fillTriTex(ctx, srcBot, dstBot);
    }
  }

  ctx.restore();
};

export default fillQuadTex;
