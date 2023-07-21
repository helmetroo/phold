import { h } from 'preact';

interface Props {
    name: string,
    classes: string,
}
export default function Icon({ name, classes }: Props) {
    // Need to use h function to be able to add the 'xlink:href' attribute
    return (
        <svg class={classes} xmlns="http://www.w3.org/2000/svg">
            {
                h('use', {
                    'xlink:href': `icons/sheet.svg#${name}`,
                    'href': `icons/sheet.svg#${name}`,
                })
            }
        </svg>
    )
}
