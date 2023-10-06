#version 300 es

precision highp float;

in  vec2 v_position;
out vec4 frag_colour;

const vec3 zero  = vec3(0.0);
const vec3 one   = vec3(1.0);
const vec3 white = one;
const vec3 blue  = vec3(0.4, 0.6, 1.0);
const vec3 brown = vec3(0.4, 0.2, 0.1);

const int MAX_SAMPLE_COUNT = 8;
const int MAX_BOUNCES      = 64;
const int BALL_COUNT       = 6;

const float PI = 3.14159265358979323846264338327950288;

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Material {
    vec3  specular_colour;
    vec3  diffuse_colour;
    float metalness;
    float emissiveness;
};

struct Ball {
    vec3     centre;
    float    radius;
    Material material;
};

layout(std140) uniform Balls {
    Ball[BALL_COUNT] balls;
};

uniform float u_time;

struct Hit {
    vec3  p;
    vec3  n;
    float t;
    Ball  b;
};

vec3 lerp(vec3 start, vec3 end, float t) {
    return (1.0 - t) * start + t * end;
}

float random(inout float state) {
    state = fract(state * 0.1031);
    state *= state + 33.33;
    state *= state + state;

    return fract(state);
}

float random_value_in_normal_distribution(inout float state) {
    float theta = 2.0 * PI * random(state);
    float rho = sqrt(-2.0 * log(random(state)));

    return rho * cos(theta);
}

vec3 random_unit3(vec3 normal, inout float state) {
    return normalize(normal + vec3(
        random_value_in_normal_distribution(state),
        random_value_in_normal_distribution(state),
        random_value_in_normal_distribution(state)
    ));
}

vec2 random_point_in_circle(inout float state) {
    float theta = 2.0 * PI * random(state);
    vec2  point_on_circle = vec2(cos(theta), sin(theta));
    vec2  point_in_circle = point_on_circle * sqrt(random(state));

    return point_in_circle;
}

vec3 random_jitter(inout float state) {
    vec3 camera_right = vec3(1.0, 0.0, 0.0);
    vec3 camera_up    = vec3(0.0, 1.0, 0.0);

    vec2 jitter_point = random_point_in_circle(state);

    return camera_right * jitter_point.x
         + camera_up    * jitter_point.y;
}

bool hit_ball(inout Hit hit, Ball ball, Ray ray) {
    bool is_hit = false;

    vec3 origin = ray.origin - ball.centre;

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(origin, ray.direction);
    float c = dot(origin, origin) - ball.radius * ball.radius;

    // Solve using the quadratic formula.
    // First step is to calculate the discriminant. This will tell us how many solutions exist.
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant >= 0.0) {
        is_hit = true;

        hit.t = (-b - sqrt(discriminant)) / (2.0 * a);
        hit.p = ray.origin + ray.direction * hit.t;
        hit.n = (hit.p - ball.centre) / ball.radius;
        hit.b = ball;
    }

    return is_hit;
}

bool hit_any(inout Hit hit, Ray ray) {
    bool  is_hit = false;
    float closest = 1.0 / 0.0;
    Hit   temp;

    for (int i = 0; i < BALL_COUNT; i += 1) {
        Ball ball = balls[i];

        if (hit_ball(temp, ball, ray) && temp.t < closest && temp.t > 0.0) {
            closest = temp.t;
            hit     = temp;
            is_hit  = true;
        }
    }

    return is_hit;
}

// The Schlick approximation of the Fresnel reflectance for the material.
vec3 schlick(vec3 specular_colour, vec3 light_direction, vec3 normal) {
    return specular_colour + (one - specular_colour) * pow(1.0 - dot(light_direction, normal), 5.0);
}

vec3 environment(Ray ray) {
    vec3  sun_light_direction = normalize(vec3(1.0, -1.0, 1.0));
    float sun_focus           = 100.0;
    float sun_intensity       = 0.6;
    float sun                 = pow(max(0.0, dot(ray.direction, -sun_light_direction)), sun_focus) * sun_intensity;

    float ground_to_sky_t = smoothstep(-0.01, 0.0, ray.direction.y);
    float sun_mask        = float(ground_to_sky_t >= 1.0);

    // return brown;
    return lerp(brown, blue, ground_to_sky_t) + sun * sun_mask;
}

void main() {
    vec3 pixel_colour = zero;

    float rng_state = dot(gl_FragCoord.xy, v_position) + u_time;

    for (int i = 0; i < MAX_SAMPLE_COUNT; i += 1) {
        vec3 jittered_origin    = zero                   + random_jitter(rng_state) * 0.001;
        vec3 jittered_direction = vec3(v_position, -1.0) + random_jitter(rng_state) * 0.001;

        Ray ray = Ray(jittered_origin, normalize(jittered_direction));

        vec3 ray_colour      = one;
        vec3 collected_light = zero;

        for (int bounce = 0; bounce < MAX_BOUNCES; bounce += 1) {
            Hit hit;

            if (hit_any(hit, ray)) {
                Material material = hit.b.material;

                vec3 specular_direction = normalize(reflect(ray.direction, hit.n));
                vec3 diffuse_direction  = random_unit3(hit.n, rng_state);

                ray.origin    = hit.p;
                ray.direction = lerp(diffuse_direction, specular_direction, material.metalness);

                // ray_colour *= diffuse_direction;
                ray_colour *= lerp(
                    material.diffuse_colour / PI,
                    material.specular_colour,
                    material.metalness
                );

                collected_light += material.emissiveness * ray_colour;
            } else {
                collected_light += environment(ray) * ray_colour;

                // The ray missed all the objects, so we can move on to the next sample.
                break;
            }
        }

        pixel_colour += collected_light;
    }

    float scale = 1.0 / float(MAX_SAMPLE_COUNT);

    frag_colour = vec4(
        clamp(sqrt(pixel_colour.x * scale), 0.0, 1.0),
        clamp(sqrt(pixel_colour.y * scale), 0.0, 1.0),
        clamp(sqrt(pixel_colour.z * scale), 0.0, 1.0),
        1.0
    );
}
