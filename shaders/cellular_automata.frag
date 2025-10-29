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
    float t = getTime();
    vec2 res = getRes();
    vec2 uv = gl_FragCoord.xy / res;
    vec2 px = 1.0 / res;

    // 以時間為世代，每秒一代
    int gen = int(floor(t));

    // 只做有限步數，避免 shader loop 過多
    int maxGen = 20;
    if (gen > maxGen) gen = maxGen;

    // 初始狀態：圖片灰階
    float state = texture2D(u_tex0, uv).r > 0.5 ? 1.0 : 0.0;

    // 每一代演算
    for (int g = 0; g < 20; g++) {
        if (g >= gen) break;
        float n = getNeighborSum(u_tex0, uv, px);
        // Conway's Game of Life 規則
        if (state > 0.5) {
            if (n < 2.0 || n > 3.0) state = 0.0;
            else state = 1.0;
        } else {
            if (n == 3.0) state = 1.0;
            else state = 0.0;
        }
    }

    gl_FragColor = vec4(vec3(state), 1.0);
}
