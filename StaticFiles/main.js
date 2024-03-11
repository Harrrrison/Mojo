// make the line ease in on scroll
/*window.addEventListener('scroll', () => {
    const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if (scrolled > 0) {
	line.style.width = "75vw";
    } else {
	line.style.width = "0vw";
    }
});*/

const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");
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

const vs_src = `#version 300 es


layout (location = 0) in vec2 vertex_position;
//attribute vec2 vertex_position;

void main() {
  gl_Position = vec4(vertex_position, 0.0, 1.0);
}`;

const fs_src = `#version 300 es

precision highp float;

layout (location = 0) out vec4 fragColor;

uniform vec2 resolution;
uniform vec2 mouse_pos;
uniform float time;

#define MAX_BLUR .5

#define MIN_THICK 0.008

#define SCALE 0.5

#define aspect_ratio ((resolution.x >= resolution.y) ? vec2(resolution.x / resolution.y, 1.0) : vec2(1.0, resolution.y / resolution.x))
#define mouse_sp ((mouse_pos / resolution * 2.0 - 1.0) * aspect_ratio)

int lcg(inout int previous)
{
    const int multiplier = 1664525;
    const int increment = 1013904223;
    previous   = (multiplier * previous + increment);
    return previous & 0x00FFFFFF;
}

float rand(inout int seed) {
  return float(lcg(seed)) / float(0x01000000);
}

float get_line_y(vec2 p, float offs, float scale, float spd) {
  offs = time / 1000.0 * spd + offs + mouse_sp.x;
  // reduce scale away from mouse
  float mx_scale = 1.0 - smoothstep(0.0, aspect_ratio.x, abs(mouse_sp.x - p.x));
  float my_scale = 1.0 - smoothstep(0.0, aspect_ratio.y, abs(mouse_sp.y));
  scale *= 1.0 + (mx_scale * my_scale) / 2.0;
  return sin(p.x * 4.0 + offs) * scale * (1.0 - smoothstep(0.0, aspect_ratio.x, abs(p.x)));
}

float sample_line(float line_y, vec2 p) {
  // blur edges
  float blur = smoothstep(0.2, aspect_ratio.x, abs(p.x)) * MAX_BLUR * 4.0 / 5.0;
  blur += smoothstep(0.0, aspect_ratio.x, abs(p.x - mouse_sp.x)) * MAX_BLUR / 5.0;
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

vec2 cylinder_distort(vec2 uv, float k) {
  float uvd = abs(uv.x);
  uv.x *= 1.0 + k*uvd*uvd;
  return uv;
}

#define DISTORT_MAX 0.05

vec3 chroma_sample(vec3 col, vec2 pb, float t) {
  float sgn = fract(t * 6.0/2.0) * 4.0 - 1.0;
  float distort = DISTORT_MAX;
  vec2 p = cylinder_distort(pb, distort);
  float r = col.r * sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  p = cylinder_distort(pb, distort / 2.0);
  float g = col.g * sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  p = cylinder_distort(pb, 0.0);
  float b = col.b * sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);

  return vec3(r, g, b);
}

vec3 chroma_sample2(vec3 col1, vec3 col2, vec2 pb, float t) {
  float edge_fade = 1.0 - smoothstep(0.2, aspect_ratio.x * 1.5, abs(pb.x));
  col1 = mix(col2, col1, edge_fade);
  float sgn = fract(t * 6.0/2.0) * 4.0 - 1.0;
  float distort = DISTORT_MAX;
  float amt = 0.;
  vec2 p = cylinder_distort(pb, distort);
  amt = sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  float r = mix(col2.r, col1.r, amt);
  p = cylinder_distort(pb, distort / 2.0);
  amt = sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  float g = mix(col2.g, col1.g, amt);
  p = cylinder_distort(pb, 0.0); // p = pb;
  amt = sample_line(get_line_y(p, t * 2.0, SCALE - t * 0.2, (1.2 + t) * sgn), p);
  float b = mix(col2.b, col1.b, amt);

  return vec3(r, g, b);
}

void main() {
  vec3 pink = vec3(0.894, 0.467, 0.502) * 1.2;
  //vec3 green = vec3(15.0/255.0, 122.0/255.0, 24.0/255.0);
  vec3 green = vec3(173.4/255.0, 209.1/255.0, 114.75/255.0);
  //vec3 green = vec3(0.68, 0.82, 0.45);

  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (uv * 2.0 - 1.0) * aspect_ratio; // aspect-correct space

  //p = barrel_distort(p, -.05);

  vec3 s = vec3(0.);
  int seed = 120213;
  for (int i = 0; i < 6; ++i) {
    float t = rand(seed);
    s += chroma_sample2(pink, green, p, t) / 6.0;
  }
  
  fragColor = vec4(s, 1.0);
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
