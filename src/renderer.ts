import { mat4 } from 'gl-matrix';

import Source from '@/types/source';
import BlankSource from './blank';

import TwoDVertShader from '@/shaders/2d.vert';
import TwoDFragShader from '@/shaders/2d.frag';

export default class Renderer {
    private gl: WebGLRenderingContext;
    private programInfo: ReturnType<Renderer['initShaderProgram']>;
    private buffers: ReturnType<Renderer['initBuffers']>;
    private texture: ReturnType<Renderer['initTexture']>;

    private running = false;
    private currentSource: Source = new BlankSource();

    set source(newSource: Source) {
        this.currentSource = newSource;
        this.updateTexture();
    }

    constructor(canvasElem: HTMLCanvasElement, source: Source) {
        // Init GL
        const gl = canvasElem.getContext('webgl');
        if (!gl) {
            throw new Error(`Your browser doesn't support WebGL or it's disabled.`);
        }

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.gl = gl;
        this.programInfo = this.initShaderProgram();
        this.buffers = this.initBuffers();
        this.texture = this.initTexture();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this.source = source;
    }

    private initShaderProgram() {
        const { gl } = this;

        const vertShader = this.loadShader(gl.VERTEX_SHADER, TwoDVertShader);
        const fragShader = this.loadShader(gl.FRAGMENT_SHADER, TwoDFragShader);

        const program = gl.createProgram();
        if (!program) {
            throw new Error(`Error occurred creating the shader program.`);
        }

        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Error occurred linking the shader program.`);
        }

        const programInfo = {
            program,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(program, 'vertexPos'),
                textureCoord: gl.getAttribLocation(program, 'inTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(program, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(program, 'modelViewMatrix'),
                sampler: gl.getUniformLocation(program, 'sampler'),
            }
        };

        return programInfo;
    }

    private initBuffers() {
        return {
            position: this.initPositionBuffer(),
            texCoord: this.initTexCoordBuffer(),
            index: this.initIndexBuffer(),
        };
    }

    private initPositionBuffer() {
        const { gl } = this;

        const positionBuffer = gl.createBuffer();
        if (!positionBuffer) {
            throw new Error(`Error occurred creating position buffer.`);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0, 1.0, 0.0,
            -1.0, 1.0, 0.0,
        ];

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW
        );

        return positionBuffer;
    }

    private initTexCoordBuffer() {
        const { gl } = this;

        const texCoordBuffer = gl.createBuffer();
        if (!texCoordBuffer) {
            throw new Error(`Error occurred creating texture coord buffer.`);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        const texCoords = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ]

        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(texCoords),
            gl.STATIC_DRAW
        );

        return texCoordBuffer;
    }

    private initIndexBuffer() {
        const { gl } = this;

        const indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            throw new Error(`Error occurred creating position buffer.`);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // Corresponds to bottom right and upper left triangle
        const indices = [
            0, 1, 2,
            0, 2, 3
        ];

        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            gl.STATIC_DRAW
        );

        return indexBuffer;
    }

    private initTexture() {
        const { gl } = this;

        const texture = gl.createTexture();
        if (!texture) {
            throw new Error(`Error occurred creating the source texture.`);
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

        return texture;
    }

    private updateTexture() {
        const { gl, texture } = this;

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
            this.currentSource.getRaw()
        )
    }

    private loadShader(type: number, shaderSrc: string) {
        const { gl } = this;

        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error(`Error occurred creating a shader.`);
        }

        gl.shaderSource(shader, shaderSrc);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw new Error(`Error occurred compiling a shader: ${gl.getShaderInfoLog(shader)}`)
        }

        return shader;
    }

    stop() {
        this.running = false;
    }

    start() {
        this.running = true;

        requestAnimationFrame(this.tickFrame.bind(this));
    }

    private tickFrame(_: number) {
        this.updateTexture();
        this.drawFrame();

        if (this.running)
            requestAnimationFrame(this.tickFrame.bind(this));
    }

    private drawFrame() {
        const { gl, programInfo, buffers, texture } = this;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Clear
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, -1.0, 1.0, -1.0, 1.0, -10, 10);

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -1.0]);

        this.setPositionAttribute();
        this.setTextureAttribute();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

        gl.useProgram(programInfo.program);

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix
        );
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix
        );

        // Bind the texture to the shader
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.sampler, 0);

        const vertCount = 6;
        const vertType = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertCount, vertType, offset);
    }

    private setPositionAttribute() {
        const { gl, programInfo, buffers } = this;

        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition
        );
    }

    private setTextureAttribute() {
        const { gl, programInfo, buffers } = this;

        const num = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            num,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(
            programInfo.attribLocations.textureCoord
        );
    }
}
