interface Props {
    name: string,
    classes: string,
}
export default function Icon({ name, classes }: Props) {
    const href = `icons/sheet.svg#${name}`;

    return (
        <svg
            class={classes}
            xmlns='http://www.w3.org/2000/svg'
        >
            <use href={href} />
        </svg>
    )
}
