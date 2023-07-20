import Shutter from './shutter';

import type Callback from '@/types/callback';

interface Props {
    shutterCallback: Callback,
}
export default function ShutterBar({ shutterCallback }: Props) {
    return (
        <section class='flex w-full h-[8rem] landscape:w-[8rem] landscape:h-full bg-neutral-950/30 absolute bottom-0 landscape:bottom-auto landscape:right-0 justify-center items-center'>
            <menu class='w-full h-full flex flex-row landscape:flex-col justify-center items-center'>
                <li class='w-20 h-20'>
                    <Shutter pressCallback={shutterCallback} />
                </li>
            </menu>
        </section>
    );
}
