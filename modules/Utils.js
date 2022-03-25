export function debounce(fn, ms) {
    let handle;

    return (...args) => {
        clearTimeout(handle);
        handle = setTimeout(() => fn(...args), ms);
    };
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function randomRangeInt(min, max) {
    return randomRange(min, max) | 0;
}

export function shuffle(items) {
    for (let i = 0; i < items.length; i += 1) {
        const j = randomRangeInt(0, items.length - 1);

        const temp = items[i];
        items[i]   = items[j];
        items[j]   = temp;
    }

    return items;
}
