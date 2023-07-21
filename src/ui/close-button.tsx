import type Callback from '@/types/callback';

import Icon from './icon';

interface Props {
    classes?: string,
    callback: Callback,
}
export default function CloseButton({ classes, callback }: Props) {
    return (
        <button
            class={`${classes ?? ''} flex justify-center items-center rounded-[50%] w-16 h-16 bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900 focus:scale-[1.05] focus:bg-neutral-800`}
            onClick={callback}
        >
            <Icon name='close' classes='h-8 stroke-white' />
        </button>
    );
}
