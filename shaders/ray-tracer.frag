#version 100

precision highp float;

varying vec2 v_position;

const vec3 zero  = vec3(0.0);
const vec3 one   = vec3(1.0);
const vec3 white = one;
const vec3 blue  = vec3(0.5, 0.7, 1.0);

const int max_sample_count = 4;
const int max_bounces      = 16;
const int ball_count       = 6;

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Material {
    float kind;
    float roughness;
    vec3  colour;
    float eta;
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
    return front_face ? outward_normal :-outward_normal;
}

vec3 lerp(vec3 start, vec3 end, float t) {
    return (1.0 - t) * start + t * end;
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123) + 0.000001;
}

vec2 random_unit(vec2 seed) {
    return vec2(
        random(seed.xy),
        random(seed.yx)
    );
}

vec3 random_unit(vec3 seed) {
    return vec3(
        random(seed.xy),
        random(seed.yz),
        random(seed.zx)
    );
}

bool hit_ball(inout Hit hit, Ball ball, Ray ray) {
    bool is_hit = false;

    vec3  origin_to_centre             = ball.centre - ray.origin;
    float distance_along_ray_to_centre = dot(ray.direction, origin_to_centre);

    if (distance_along_ray_to_centre > 0.0) {
        float distance_from_centre_to_ray_squared = dot(origin_to_centre, origin_to_centre) - distance_along_ray_to_centre * distance_along_ray_to_centre;
        float radius_squared                      = ball.radius * ball.radius;

        if (radius_squared > distance_from_centre_to_ray_squared) {
            is_hit = true;

            float distance_along_ray_from_intersection_to_centre = sqrt(radius_squared - distance_from_centre_to_ray_squared);

            hit.t = distance_along_ray_to_centre - distance_along_ray_from_intersection_to_centre;
            hit.p = ray.origin + ray.direction * hit.t;
            hit.n = (hit.p - ball.centre) / ball.radius;
            hit.b = ball;
        }
    }

    return is_hit;
}

bool hit_any(inout Hit hit, Ball[ball_count] balls, Ray ray) {
    float closest = 1.0 / 0.0;
    bool  is_hit = false;
    Hit   temp;

    for (int i = 0; i < ball_count; i += 1) {
        Ball ball = balls[i];

        if (hit_ball(temp, ball, ray) && temp.t < closest) {
            closest = temp.t;
            hit     = temp;
            is_hit  = true;
        }
    }

    return is_hit;
}

void metal(inout Ray ray, inout vec3 attenuation, Hit hit) {
    ray.origin    = hit.p;
    ray.direction = normalize(reflect(ray.direction, hit.n) + random_unit(hit.n) * hit.b.material.roughness);

    attenuation = hit.b.material.colour;
}

float reflectance(float cos_theta, float eta) {
    // Use Schlick's approximation for reflectance.
    float r0 = (1.0 - eta) / (1.0 + eta);
    r0 = r0 * r0;

    return r0 + (1.0 - r0) * pow((1.0 - cos_theta), 5.0);
}

void glass(inout Ray ray, inout vec3 attenuation, Hit hit) {
    float cos_theta = dot(-ray.direction, hit.n);
    float sin_theta = sqrt(1.0 - cos_theta * cos_theta);

    float eta = cos_theta < 0.0
        ? (1.0 / hit.b.material.eta)
        :        hit.b.material.eta;

    vec3 scatter_direction = (eta * sin_theta > 1.0) || (reflectance(cos_theta, eta) > random(hit.n.xy))
        ? reflect(ray.direction, hit.n)
        : refract(ray.direction, hit.n, eta);

    ray.origin    = hit.p;
    ray.direction = normalize(scatter_direction + random_unit(hit.n) * hit.b.material.roughness);

    attenuation = ray.direction;//hit.b.material.colour;
}

void lambertian(inout Ray ray, inout vec3 attenuation, Hit hit) {
    vec3 scatter_direction = hit.n + random_unit(hit.n);

    if (
        abs(scatter_direction.x) < 1e-8 &&
        abs(scatter_direction.y) < 1e-8 &&
        abs(scatter_direction.z) < 1e-8
    ) {
        scatter_direction = hit.n;
    }

    ray.origin    = hit.p;
    ray.direction = normalize(scatter_direction);

    attenuation = hit.b.material.colour;
}

void main() {
    Ball balls[ball_count];
    balls[0] = Ball(vec3(0.0, -100.5, -1.0), 100.0, Material(0.0, 0.0, vec3(0.8, 0.8, 0.0), 1.5));
    balls[1] = Ball(vec3(0.0, -0.3, -1.5), 0.2, Material(1.0, 0.01, vec3(0.7, 0.3, 0.3), 1.5));
    balls[2] = Ball(vec3(0.7, -0.1, -1.3), -0.4, Material(2.0, 0.0, vec3(0.8, 0.6, 0.2), 1.5));
    balls[3] = Ball(vec3(0.7, -0.1, -1.3), 0.2, Material(1.0, 0.0, vec3(0.8, 0.6, 0.2), 1.5));
    balls[4] = Ball(vec3(-0.6, -0.2, -1.0), 0.3, Material(0.0, 0.0, vec3(0.1, 0.2, 0.5), 1.5));
    balls[5] = Ball(vec3(0.15, -0.3, -0.7), 0.2, Material(1.0, 0.05, vec3(0.8, 0.8, 0.8), 1.5));

    vec3 pixel_colour = zero;
    vec3 sample_colour = one;

    Ray ray;

    for (int i = 0; i < max_sample_count; i += 1) {
        vec2 uv = v_position + random_unit(v_position) * 0.001;

        ray.origin    = zero;
        ray.direction = normalize(vec3(uv, -1.0));

        vec3 colours[max_bounces];
        for (int c = 0; c < max_bounces; c += 1) {
            colours[c] = one;
        }

        for (int bounce = 0; bounce < max_bounces; bounce += 1) {
            Hit hit;

            if (hit_any(hit, balls, ray)) {
                float kind = hit.b.material.kind;

                     if (kind == 0.0) lambertian(ray, colours[bounce], hit);
                else if (kind == 1.0) metal(ray, colours[bounce], hit);
                else if (kind == 2.0) glass(ray, colours[bounce], hit);
                else                  lambertian(ray, colours[bounce], hit);
            } else {
                float pixel_height = 0.5 * (ray.direction.y + 1.0);
                colours[bounce] = lerp(white, blue, pixel_height);

                // The ray missed all the objects, so we can move on to the next sample.
                break;
            }
        }

        for (int b = max_bounces - 1; b >= 0; b -= 1) {
            sample_colour *= colours[b];
        }

        pixel_colour += sample_colour;
    }

    float scale = 1.0 / float(max_sample_count);

    gl_FragColor = vec4(
        clamp(sqrt(pixel_colour.x * scale), 0.0, 1.0),
        clamp(sqrt(pixel_colour.y * scale), 0.0, 1.0),
        clamp(sqrt(pixel_colour.z * scale), 0.0, 1.0),
        1.0
    );
}
