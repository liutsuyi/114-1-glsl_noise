// Author:tsuyi

#ifdef GL_ES
precision mediump float;
#endif

// Poisson-like dot shader
// uniform:
//   u_resolution: vec2 (canvas resolution)
//   u_time: float (time, optional)
//   u_mouse: vec2 (mouse, optional)
//   u_scale: float (spacing in pixels, >=1)
//   u_thickness: float (0..1, controls dot radius)
//
// 中文註解說明：
// 這個 shader 在白底上產生類似 Poisson disk 的點陣（用 jittered grid 近似），
// 每個網格格子會放置一個隨機偏移的點，點的大小由 u_thickness 控制，
// 網格間距由 u_scale 控制（以像素為單位）。

uniform vec2 u_resolution; // 畫布解析度，必填
uniform vec2 u_mouse; // 滑鼠位置（可選，可用於互動）
uniform float u_time; // 時間（可選，用於動態效果）
uniform float u_scale; // 點陣間距（像素），數值越大點越稀疏
uniform float u_thickness; // 點的粗細比例（0.0..1.0）

// 簡單的 2D hash 函式，用於在格子上產生可重複的隨機值
// 輸入 vec2，輸出 0..1 的浮點隨機數
float hash21(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

// 在每個網格格子中放一個 jittered 點（Poisson-like 的近似）
// uv: 片段座標 (0..1)，scale: 格子大小（像素）
vec2 poissonPoint(vec2 uv, float scale) {
	// 將 uv 轉成以格子為單位的座標
	vec2 grid = uv * u_resolution / scale;
	vec2 id = floor(grid); // 格子索引

	// 用格子索引產生兩個獨立的隨機數作為 jitter
	float jx = hash21(id + 0.13);
	float jy = hash21(id + 7.17);
	vec2 jitter = vec2(jx, jy) - 0.5; // -0.5..0.5

	// 限制 jitter 大小，避免點跑太遠出格子
	jitter *= 0.9;

	// 計算點在畫布上的位置（轉回正規化座標）
	vec2 pt = (id + 0.5 + jitter) * scale / u_resolution;
	return pt;
}

// 圓形的 SDF（signed distance）：點到圓心距離減半徑
float circleSdf(vec2 p, vec2 c, float r) {
	return length(p - c) - r;
}

void main() {
	// 取得片段的正規化螢幕座標 (0..1)
	vec2 st = gl_FragCoord.xy / u_resolution.xy;

	// 參數保護：避免 scale 為零或負值
	float scale = max(1.0, u_scale);
	float thickness = clamp(u_thickness, 0.0, 1.0);

	// 從白色開始繪製背景
	vec3 col = vec3(1.0);

	// 取得該片段所屬格子的點座標
	vec2 pt = poissonPoint(st, scale);


	// 將半徑改為以 "像素" 為單位，讓 u_thickness 更直覺地控制實際像素大小
	// 計算像素半徑（r_px）: 我們將半徑設定為 cell 大小的比例
	float r_px = 0.5 * (scale * (0.2 + thickness * 0.8));

	// 計算片段到點的距離（以像素為單位）
	vec2 pt_px = pt * u_resolution; // 把正規化座標轉回像素座標
	float d_px = length(gl_FragCoord.xy - pt_px);

	// 使用像素為單位的柔邊（edge_px）做 smoothstep
	float edge_px = 1.5; // 邊緣柔化厚度（像素），可視解析度調整
	float alpha = smoothstep(r_px + edge_px, r_px - edge_px, d_px);

	// 將黑色點混合到白色背景上
	col = mix(col, vec3(0.0), alpha);

	gl_FragColor = vec4(col, 1.0);
}