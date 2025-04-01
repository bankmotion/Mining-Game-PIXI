// Map-related interfaces for the mining game

export interface Tileset {
  name: string;
  image?: string;
  firstgid: number;
  tilecount?: number;
  columns?: number;
  imageheight?: number;
  imagewidth?: number;
  margin?: number;
  spacing?: number;
  tileheight?: number;
  tilewidth?: number;
  transparentcolor?: string;
  source?: string;
  tiles?: Array<{
    id: number;
    animation?: Array<{
      duration: number;
      tileid: number;
    }>;
  }>;
}

export interface MapLayer {
  data?: number[];
  height?: number;
  id: number;
  name: string;
  opacity: number;
  type: string;
  visible: boolean;
  width?: number;
  x?: number;
  y?: number;
  draworder?: string;
  objects?: Array<{
    gid: number;
    height: number;
    id: number;
    name: string;
    rotation: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
  }>;
  offsetx?: number;
  offsety?: number;
}

export interface Map {
  tilesets: Tileset[];
  compressionlevel?: number;
  height?: number;
  layers?: MapLayer[];
  nextlayerid?: number;
  nextobjectid?: number;
  orientation?: string;
  renderorder?: string;
  tiledversion?: string;
  tileheight?: number;
  tilewidth?: number;
  width?: number;
  infinite?: boolean;
  type?: string;
  version?: string;
}
