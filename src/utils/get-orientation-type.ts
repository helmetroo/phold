export default function getOrientationType(): OrientationType {
    const windowIsLandscape = window.matchMedia('(orientation: landscape)').matches;
    const orientationType = screen?.orientation.type ?? 'unknown';

    const orientationTypeSplit = orientationType.split('-');
    const orientationAngleName =
        (orientationTypeSplit[1] as 'primary' | 'secondary') ?? 'primary';

    return windowIsLandscape
        ? `landscape-${orientationAngleName}`
        : `portrait-${orientationAngleName}`;
}
