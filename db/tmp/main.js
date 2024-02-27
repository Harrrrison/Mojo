const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    document.getElementById("error").innerHTML = "Your browser doesn't support webGL";
}

gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

const vs_src = `#version 100

attribute vec2 vertex_position;

void main() {
  gl_Position = vec4(vertex_position, 0.0, 1.0);
}`;

const fs_src = `#version 100

void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

// create shader progam
const vs = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vs, vs_src);
gl.compileShader(vs);

const fs = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fs, fs_src);
gl.compileShader(fs);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.detachShader(program, vs);
gl.detachShader(program, fs);
gl.deleteShader(vs);
gl.deleteShader(fs);

const vertex_attrib = gl.getAttribLocation(program, "vertex_position");
const res_location = gl.getUniformLocation(program, "resolution");
const time_location = gl.getUniformLocation(program, "time");

// create a quad
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
const vertices = [
    // tri 1
    -1, -1,
    -1, 1,
    1, -1,
    // tri 2
    -1, 1,
    1, -1,
    1, 1
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.vertexAttribPointer(vertex_attrib, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vertex_attrib);

let t = 0.0;

function draw_fullscreen() {
    t += 16.67;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(res_location, 800, 600);
    gl.uniform1f(time_location, t);
    gl.drawArrays(gl.LINES, 0, 6);
}

// 60 fps
timer = setInterval(draw_fullscreen, 16);
