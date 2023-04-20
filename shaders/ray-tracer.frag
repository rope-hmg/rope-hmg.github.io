#version 100

precision highp float;

varying vec2 v_position;

const vec3 zero  = vec3(0.0);
const vec3 one   = vec3(1.0);
const vec3 white = one;
const vec3 blue  = vec3(0.5, 0.7, 1.0);
const vec3 brown = vec3(0.4, 0.2, 0.1);

const int max_sample_count = 32;
const int max_bounces      = 4;
const int ball_count       = 6;

const float PI = 3.14159265358979323846264338327950288;

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Material {
    vec3  specular_colour;
    float specular_roughness;

    vec3  diffuse_colour;
    float diffuse_roughness;

    float metalness;
    float emissiveness;
};

struct Ball {
    vec3     centre;
    float    radius;
    Material material;
};

struct Hit {
    vec3  p;
    vec3  n;
    float t;
    Ball  b;
};

vec3 face_normal(Ray ray, vec3 outward_normal) {
    bool front_face = dot(ray.direction, outward_normal) < 0.0;
    return front_face ? outward_normal : -outward_normal;
}

vec3 lerp(vec3 start, vec3 end, float t) {
    return (1.0 - t) * start + t * end;
}

float random(inout float state) {
    state = fract(state * .1031);
    state *= state + 33.33;
    state *= state + state;

    return fract(state);
}

vec2 random_unit2(inout float state) {
    return vec2(
        random(state),
        random(state)
    );
}

vec3 random_unit3(inout float state) {
    return vec3(
        random(state),
        random(state),
        random(state)
    );
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

    vec3 translated_origin = ray.origin - ball.centre;

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(translated_origin, ray.direction);
    float c = dot(translated_origin, translated_origin) - ball.radius * ball.radius;

    // Solve using the quadratic formula.
    // First step is to calculate the discriminant. This will tell us how many solutions exist.
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant >= 0.0) {
        is_hit = true;

        hit.t = (-b - sqrt(discriminant)) / 2.0 * a;
        hit.p = ray.origin + ray.direction * hit.t;
        hit.n = (hit.p - ball.centre) / ball.radius;
        hit.b = ball;
    }

    return is_hit;
}

bool hit_any(inout Hit hit, Ball[ball_count] balls, Ray ray) {
    bool  is_hit = false;
    float closest = 1.0 / 0.0;
    Hit   temp;

    for (int i = 0; i < ball_count; i += 1) {
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
    float sky_gradient_t = pow(smoothstep(0.0, 0.4, ray.direction.y), 0.35);
    vec3  sky_gradient   = lerp(white, blue, sky_gradient_t);

    vec3  sun_light_direction = normalize(vec3(1.0, -1.0, 1.0));
    float sun_focus           = 1.0;
    float sun_intensity       = 1.0;
    float sun                 = pow(max(0.0, dot(ray.direction, -sun_light_direction)), sun_focus) * sun_intensity;

    float ground_to_sky_t = smoothstep(-0.01, 0.0, ray.direction.y);
    float sun_mask        = float(ground_to_sky_t >= 1.0);

    return lerp(brown, sky_gradient, ground_to_sky_t) + sun * sun_mask;
}

void main() {
    Ball balls[ball_count];
    balls[0] = Ball(vec3( 0.0,  -100.5, -1.0  ),  100.0, Material(vec3(0.000, 0.000, 0.000), 1.0, vec3(0.419, 0.266, 0.137), 1.0,  0.1, 0.0)); // Dirt
    balls[1] = Ball(vec3( 0.0,  -0.3,   -1.5  ),  0.2,   Material(vec3(0.542, 0.497, 0.499), 0.5, vec3(1.000, 1.000, 1.000), 0.01, 1.0, 0.0)); // Titanium
    balls[2] = Ball(vec3( 0.7,  -0.1,   -1.3  ),  0.4,   Material(vec3(0.045, 0.045, 0.045), 0.2, vec3(1.000, 1.000, 1.000), 0.1,  0.2, 0.0)); // Glass
    balls[3] = Ball(vec3(-20.0,  20.0,  -100.0),  30.0,  Material(vec3(0.562, 0.565, 0.578), 0.7, vec3(1.000, 1.000, 1.000), 0.12,  1.0, 0.0)); // Iron
    balls[4] = Ball(vec3(-0.6,  -0.2,   -1.0  ),  0.3,   Material(vec3(0.100, 0.100, 0.100), 0.1, vec3(0.000, 0.392, 0.000), 0.7,  0.4, 0.0)); // Plastic
    balls[5] = Ball(vec3( 0.15, -0.3,   -0.7  ),  0.2,   Material(vec3(0.955, 0.638, 0.538), 0.3, vec3(1.000, 1.000, 1.000), 0.05, 1.0, 0.0)); // Copper

    vec3 pixel_colour = zero;

    float rng_state = v_position.x + v_position.y * 1000.0;

    for (int i = 0; i < max_sample_count; i += 1) {
        vec3 jittered_origin    = zero                   + random_jitter(rng_state) * 0.001;
        vec3 jittered_direction = vec3(v_position, -1.0) + random_jitter(rng_state) * 0.001;

        Ray ray = Ray(jittered_origin, normalize(jittered_direction));

        vec3 ray_colour      = one;
        vec3 collected_light = zero;

        for (int bounce = 0; bounce < max_bounces; bounce += 1) {
            Hit hit;

            if (hit_any(hit, balls, ray)) {
                Material material = hit.b.material;

                ray.origin = hit.p;

                vec3 specular_direction = normalize(reflect(ray.direction, hit.n));
                vec3 diffuse_direction  = normalize(random_unit3(rng_state) + hit.n);

                ray.direction = lerp(diffuse_direction, specular_direction, material.metalness);

                collected_light += blue * material.emissiveness * ray_colour;
                ray_colour      *= lerp(
                    material.diffuse_colour / PI,
                    schlick(material.specular_colour, ray.direction, hit.n),
                    material.metalness
                );
            } else {
                collected_light += environment(ray) * ray_colour;

                // The ray missed all the objects, so we can move on to the next sample.
                break;
            }
        }

        pixel_colour += collected_light;
    }

    float scale = 1.0 / float(max_sample_count);

    gl_FragColor = vec4(
        clamp(sqrt(pixel_colour.x * scale), 0.0, 1.0),
        clamp(sqrt(pixel_colour.y * scale), 0.0, 1.0),
        clamp(sqrt(pixel_colour.z * scale), 0.0, 1.0),
        1.0
    );
}
