import Shutter from './shutter';

interface UIBarProps {
    shutterCallback: () => void,
}
export default function UIBar({ shutterCallback }: UIBarProps) {
    return (
        <section class='flex w-full h-[8rem] bg-neutral-950 absolute bottom-0 justify-center items-center'>
            <menu class='w-[77%] h-[77%] flex flex-row justify-center items-center'>
                <li class='w-20 h-20'>
                    <Shutter pressCallback={shutterCallback} />
                </li>
            </menu>
        </section>
    );
}
