export interface Options {
 output: number;
 background?: string;
 padding?: number;
 
//  outputは出力サイズ、バックグラウンドでは色、paddingは余白のサイズを指定
}

export interface Input {
    data: Buffer | string;
    id?: string;

    // dataは画像データ、idはオプションで識別子を指定
}

export interface Output {
    buffer: Buffer;
    gridSize: number;
    count: number;
}