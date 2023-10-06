function report(message) {
    const error = document.getElementById("error");

    if (error) {
        error.textContent += message;
    }

    console.error(message);
}

function createShader(context, shaderSource, shaderType) {
    const shader = context.createShader(shaderType);
    if (!shader) {
        report("Unable to create shader object");
        return;
    }

    context.shaderSource(shader, shaderSource);
    context.compileShader(shader);

    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        report(`Shader compilation error: ${context.getShaderInfoLog(shader)}`);
        return;
    }

    return shader;
}

export async function createProgram(context) {
    const [vertSource, fragSource] = await Promise.all([
        fetch("/shaders/ray-tracer.vert").then((response) => response.text()),
        fetch("/shaders/ray-tracer.frag").then((response) => response.text()),
    ]);

    const program = context.createProgram();
    const vertShader = createShader(context, vertSource, context.VERTEX_SHADER);
    const fragShader = createShader(context, fragSource, context.FRAGMENT_SHADER);

    if (program && vertShader && fragShader) {
        context.attachShader(program, vertShader);
        context.attachShader(program, fragShader);

        context.linkProgram(program);

        context.detachShader(program, vertShader);
        context.detachShader(program, fragShader);
    }

    context.deleteShader(vertShader);
    context.deleteShader(fragShader);

    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
        report(`Program link error: ${context.getProgramInfoLog(program)}`);
        context.deleteProgram(program);
        return;
    }

    return program;
}
