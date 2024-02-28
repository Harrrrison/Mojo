const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");
let mouse_x = 0;
let mouse_y = 0;
canvas.addEventListener("mousemove", (event) => {
    mouse_x = event.clientX;
    mouse_y = event.clientY;
});
document.getElementById("main-body").addEventListener("mousemove", (event) => {
    mouse_x = event.clientX;
    mouse_y = event.clientY;
});

if (!gl) {
    document.getElementById("error").innerHTML = "Your browser doesn't support webGL";
}

const vs_src = `#version 100

attribute vec2 vertex_position;

void main() {
  gl_Position = vec4(vertex_position, 0.0, 1.0);
}`;

const fs_src = `#version 100

precision highp float;

uniform vec2 resolution;
uniform vec2 mouse_pos;
uniform float time;

#define MAX_BLUR .5

#define MIN_THICK 0.008

#define SCALE 0.5

#define aspect_ratio (resolution.x / resolution.y)
#define mouse_sp ((mouse_pos / resolution * 2.0 - 1.0) * vec2(aspect_ratio, 1.0))

float get_line_y(vec2 p, float offs, float scale, float spd) {
  offs = time / 1000.0 * spd + offs;
  // reduce scale away from mouse
  float mx_scale = 1.0 - smoothstep(0.0, aspect_ratio, abs(mouse_sp.x - p.x));
  float my_scale = 1.0 - smoothstep(0.0, 1.0, abs(mouse_sp.y));
  scale *= 1.0 + (mx_scale * my_scale);
  return sin(p.x * 4.0 + offs) * scale * (1.0 - smoothstep(0.0, aspect_ratio, abs(p.x)));
}

float sample_line(float line_y, vec2 p) {
  // blur edges
  float blur = smoothstep(0.2, 1.0 * aspect_ratio, abs(p.x)) * MAX_BLUR;
  blur *= blur; // quadratify it
  return smoothstep(blur, 0.0, abs(line_y - p.y) - MIN_THICK);
}

// takes some uv centered on 0
vec2 barrel_distort(vec2 uv, float k) {
  float uva = atan(uv.x, uv.y);
  float uvd = sqrt(dot(uv, uv));
  uvd *= 1.0 + k*uvd*uvd;
  return vec2(sin(uva), cos(uva)) * uvd;
}

#define DISTORT_MAX 0.05

vec3 chroma_sample(vec3 col, vec2 pb, float t) {
  float sgn = fract(t * 6.0/2.0) * 4.0 - 1.0;
  vec2 p = barrel_distort(pb, DISTORT_MAX);
  float r = col.r * sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  p = barrel_distort(pb, DISTORT_MAX / 2.0);
  float g = col.g * sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  p = barrel_distort(pb, 0.0);
  float b = col.b * sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);

  return vec3(r, g, b);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (uv * 2.0 - 1.0) * aspect_ratio; // aspect-correct space

  vec3 s = vec3(0.0);
  for (int i = 0; i < 6; ++i) {
    float t = float(i) / 6.0;
    //float sgn = fract(float(i)/2.0) * 4.0 - 1.0;
    //vec3 col = vec3(0.8 - t/4.0, 0.2, t / 2.0 + 0.2);
    vec3 col = vec3(0.5);
    s += chroma_sample(col, p, t);
    //s += sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p) * col;
  }


  float edge_fade = 1.0 - smoothstep(0.0, aspect_ratio * 1.1, abs(p.x));
  gl_FragColor = vec4(s * edge_fade, 1.0);
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
const mouse_location = gl.getUniformLocation(program, "mouse_pos");
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
    if (canvas.width != canvas.offsetWidth || canvas.height != canvas.offsetHeight) {
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    // clear screen
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw fullscreen quad with shader
    gl.useProgram(program);
    gl.uniform2f(res_location, canvas.offsetWidth, canvas.offsetHeight);
    gl.uniform2f(mouse_location, mouse_x, mouse_y);
    gl.uniform1f(time_location, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // increment timer
    t += 16.67;
}

// 60 fps
timer = setInterval(draw_fullscreen, 16);
