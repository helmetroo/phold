import PickImageButton from './pick-image-button';
import Shutter from './shutter';
import SwapCameraButton from './swap-camera-button';

import type Callback from '@/types/callback';
import type { FileCallback } from '@/types/callback';

interface Props {
    pickImageCallback: FileCallback,
    shutterCallback: Callback,
}
export default function ShutterBar({ pickImageCallback, shutterCallback }: Props) {
    return (
        <section class='flex w-full h-[8rem] landscape:w-[8rem] landscape:h-full bg-neutral-950/30 absolute bottom-0 landscape:bottom-auto landscape:right-0 justify-center items-center'>
            <menu class='w-full h-full flex flex-row landscape:flex-col-reverse justify-center items-center space-x-8 landscape:space-x-0 landscape:space-y-8 landscape:space-y-reverse'>
                <li class='w-16 h-16'>
                    <PickImageButton chooseCallback={pickImageCallback} />
                </li>
                <li class='w-20 h-20'>
                    <Shutter pressCallback={shutterCallback} />
                </li>
                <li class='w-16 h-16'>
                    <SwapCameraButton />
                </li>
            </menu>
        </section>
    );
}
