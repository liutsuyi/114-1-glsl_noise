// Cellular Automata fragment shader (2D, image-based initial state)
// 初始狀態由 u_tex0 圖片採樣

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform float iTime;
uniform float time;
uniform vec2 u_resolution;
uniform vec2 iResolution;
uniform vec2 resolution;
uniform sampler2D u_tex0;
// buffer uniform for ping-pong (GlslCanvas will bind this when BUFFER_0 is used)
uniform sampler2D u_buffer0;

// 取得時間與解析度
float getTime() {
    float t = u_time;
    if (t == 0.0) t = iTime;
    if (t == 0.0) t = time;
    return t;
}
vec2 getRes() {
    vec2 res = u_resolution;
    if (res.x == 0.0) res = iResolution;
    if (res.x == 0.0) res = resolution;
    if (res.x == 0.0) res = vec2(900.0, 600.0);
    return res;
}

// 取得鄰居狀態 (8鄰居)
float getNeighborSum(sampler2D tex, vec2 uv, vec2 px) {
    float sum = 0.0;
    for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
            if (dx == 0 && dy == 0) continue;
            vec2 offset = vec2(float(dx), float(dy)) * px;
            sum += texture2D(tex, uv + offset).r > 0.5 ? 1.0 : 0.0;
        }
    }
    return sum;
}

void main() {
    // We support two compilation modes for GlslCanvas:
    // - BUFFER_0 (buffer pass): updates the cellular automata state using
    //   the previous buffer texture (u_buffer0). On the very first frames
    //   (when u_time is near zero) we seed the buffer from u_tex0.
    // - default/main pass: simply displays the buffer texture produced by
    //   the buffer pass.

#ifdef BUFFER_0
    float t = getTime();
    vec2 res = getRes();
    vec2 uv = gl_FragCoord.xy / res;
    vec2 px = 1.0 / res;

    // 初始狀態（t 很小時從 u_tex0 取樣，作為種子）
    float state;
    if (t < 0.05) {
        state = texture2D(u_tex0, uv).r > 0.5 ? 1.0 : 0.0;
    } else {
        state = texture2D(u_buffer0, uv).r > 0.5 ? 1.0 : 0.0;
    }

    // single-step: 根據上一代計算下一代並輸出
    float n;
    if (t < 0.05) {
        n = getNeighborSum(u_tex0, uv, px);
    } else {
        n = getNeighborSum(u_buffer0, uv, px);
    }
    float nextState = state;
    // Conway's Game of Life 規則
    if (state > 0.5) {
        if (n < 2.0 || n > 3.0) nextState = 0.0;
        else nextState = 1.0;
    } else {
        if (n == 3.0) nextState = 1.0;
        else nextState = 0.0;
    }

    gl_FragColor = vec4(vec3(nextState), 1.0);
#else
    // Main pass: just display the buffer texture (the buffer will be
    // created by GlslCanvas when it finds BUFFER_0 in the fragment).
    vec2 res = getRes();
    vec2 uv = gl_FragCoord.xy / res;
    gl_FragColor = texture2D(u_buffer0, uv);
#endif
}
