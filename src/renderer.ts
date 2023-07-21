import AppError from '@/types/app-error';
import type Callback from '@/types/callback';
import type Source from '@/types/source';
import type Folds from '@/types/face';
import type { RectPair } from '@/types/rect';

import BlankSource from './blank';

import TwoDVertShader from '@/shaders/2d.vert';
import TwoDFragShader from '@/shaders/2d.frag';

const FULL_QUAD_VERTICES = [
    -1.0, -1.0,
    1.0, -1.0,
    1.0, 1.0,
    -1.0, 1.0
];

// Corresponds to bottom right and upper left triangle
const FULL_QUAD_INDICES = [
    0, 1, 2,
    0, 2, 3
];

const FULL_QUAD_TEXCOORDS = [
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
];

interface Context {
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    locations: ReturnType<typeof initLocations>,
    buffers: ReturnType<typeof initBuffers>,
    texture: WebGLTexture,
}

export default class Renderer {
    private active = false;

    private rendererContext: Context | null = null;

    private currentSource: Source = new BlankSource();
    private currentFaceFolds: Folds[] = [];

    constructor(
        private onRequestResize: Callback
    ) { }

    initContextFromCanvas(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new AppError(
                'WebGL2UnsupportedErr', [
                `This app requires your browser to support WebGL 2.`,
                `It could also disabled. Please check your browser settings.`
            ]
            );
        }

        // Initial GL settings
        // WebGL expects pixels to be in bottom-to-top order, hence the call to pixelStorei
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const program = initShaderProgram(gl);
        this.rendererContext = {
            gl,
            program,
            locations: initLocations(gl, program),
            buffers: initBuffers(gl),
            texture: initTexture(gl)
        };
    }

    set source(newSource: Source) {
        this.currentSource = newSource;

        if (this.rendererContext) {
            updateTexture(
                this.rendererContext.gl,
                this.rendererContext.texture,
                this.currentSource
            );
        }
    }

    get folds() {
        return this.currentFaceFolds;
    }

    set folds(newFolds: Folds[]) {
        this.currentFaceFolds = newFolds;
    }

    stop() {
        this.active = false;
    }

    start() {
        this.active = true;

        requestAnimationFrame(this.tickFrame.bind(this));
    }

    private tickFrame(_: number) {
        if (!this.rendererContext)
            return;

        this.onRequestResize();

        updateTexture(this.rendererContext.gl, this.rendererContext.texture, this.currentSource);
        renderFolds(this.rendererContext, this.currentFaceFolds);

        if (this.active)
            requestAnimationFrame(this.tickFrame.bind(this));
    }

    forceRender() {
        if (!this.rendererContext)
            return;

        updateTexture(this.rendererContext.gl, this.rendererContext.texture, this.currentSource);
        renderFolds(this.rendererContext, this.currentFaceFolds);
    }
}

function initShaderProgram(gl: WebGL2RenderingContext) {
    const vertShader = loadShader(gl, gl.VERTEX_SHADER, TwoDVertShader);
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, TwoDFragShader);

    const program = gl.createProgram();
    if (!program) {
        throw new AppError(
            'ShaderProgramCreationErr',
            `Error occurred creating the shader program.`
        );
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const linkErrMsg = `Error occurred linking a shader: ${gl.getProgramInfoLog(program)}`;
        gl.deleteProgram(program);
        throw new AppError(
            'ShaderLinkErr',
            linkErrMsg
        );
    }

    return program;
}

function initLocations(
    gl: WebGL2RenderingContext,
    shaderProgram: WebGLProgram
) {
    return {
        attribute: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'vertexPos'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'inTextureCoord'),
        },

        uniform: {
            sampler: gl.getUniformLocation(shaderProgram, 'sampler'),
        }
    }
}

function initBuffers(gl: WebGL2RenderingContext) {
    return {
        position: initPositionBuffer(gl),
        texCoord: initTexCoordBuffer(gl),
        index: initIndexBuffer(gl),
    };
}

function initPositionBuffer(gl: WebGL2RenderingContext) {
    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
        throw new AppError(
            'PositionBufferCreationErr',
            `Error occurred creating position buffer.`
        );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(FULL_QUAD_VERTICES),
        gl.STATIC_DRAW
    );

    return positionBuffer;
}

function initTexCoordBuffer(gl: WebGL2RenderingContext) {
    const texCoordBuffer = gl.createBuffer();
    if (!texCoordBuffer) {
        throw new AppError(
            'TexCoordBufferCreationErr',
            `Error occurred creating texture coord buffer.`
        );
    }

    // 1 is right and top
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(FULL_QUAD_TEXCOORDS),
        gl.STATIC_DRAW
    );

    return texCoordBuffer;
}

function initIndexBuffer(gl: WebGL2RenderingContext) {
    const indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        throw new AppError(
            'PositionBufferCreationErr',
            `Error occurred creating position buffer.`
        );
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(FULL_QUAD_INDICES),
        gl.STATIC_DRAW
    );

    return indexBuffer;
}

function initTexture(gl: WebGL2RenderingContext) {
    const texture = gl.createTexture();
    if (!texture) {
        throw new AppError(
            'TextureCreationErr',
            `Error occurred creating the source texture.`
        );
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([10, 10, 20, 255]);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
    );

    // No mipmaps (for now)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}

function updateTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    source: Source
) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        source.getRaw()
    )
}

function loadShader(
    gl: WebGL2RenderingContext,
    type: number,
    shaderSrc: string
) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new AppError(
            'ShaderCreationErr',
            `Error occurred creating a shader.`
        );
    }

    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const compileErrMsg = `Error occurred compiling a shader: ${gl.getShaderInfoLog(shader)}`;
        gl.deleteShader(shader);
        throw new AppError(
            'ShaderCompilationErr',
            compileErrMsg
        );
    }

    return shader;
}

function renderFolds(rendererGl: Context, faceFolds: Folds[]) {
    const { gl, program, locations, buffers, texture } = rendererGl;

    // Clear
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    // Setup attributes
    setPositionAttribute(gl, locations, buffers);
    setTextureAttribute(gl, locations, buffers);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

    // Bind the texture to the shader
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(locations.uniform.sampler, 0);

    // Draw geom
    drawBackground(gl, buffers);

    for (const face of faceFolds) {
        drawFaceFold(face.eyes, gl, buffers);
        drawFaceFold(face.mouth, gl, buffers);
    }
}

function drawBackground(
    gl: WebGL2RenderingContext,
    buffers: Context['buffers']
) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(FULL_QUAD_VERTICES),
        gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(FULL_QUAD_TEXCOORDS),
        gl.STATIC_DRAW
    );
    drawQuad(gl);
}

function drawFaceFold(
    fold: RectPair,
    gl: WebGL2RenderingContext,
    buffers: Context['buffers']
) {
    const {
        clipSpace: clipSpaceRect,
        textureSpace: textureSpaceRect
    } = fold;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            clipSpaceRect.bl.x, clipSpaceRect.bl.y,
            clipSpaceRect.br.x, clipSpaceRect.br.y,
            clipSpaceRect.ur.x, clipSpaceRect.ur.y,
            clipSpaceRect.ul.x, clipSpaceRect.ul.y,
        ]),
        gl.STATIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            textureSpaceRect.bl.x, textureSpaceRect.bl.y,
            textureSpaceRect.br.x, textureSpaceRect.br.y,
            textureSpaceRect.ur.x, textureSpaceRect.ur.y,
            textureSpaceRect.ul.x, textureSpaceRect.ul.y,
        ]),
        gl.STATIC_DRAW
    );
    drawQuad(gl);
}

function drawQuad(gl: WebGL2RenderingContext) {
    const vertCount = 6;
    const vertType = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertCount, vertType, offset);
}

function setPositionAttribute(
    gl: WebGL2RenderingContext,
    locations: Context['locations'],
    buffers: Context['buffers']
) {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        locations.attribute.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset
    );
    gl.enableVertexAttribArray(
        locations.attribute.vertexPosition
    );
}

function setTextureAttribute(
    gl: WebGL2RenderingContext,
    locations: Context['locations'],
    buffers: Context['buffers']
) {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.vertexAttribPointer(
        locations.attribute.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset
    );
    gl.enableVertexAttribArray(
        locations.attribute.textureCoord
    );
}
