interface Props {
    classes?: string,
    callback: () => void,
}
export default function CloseButton({ classes, callback }: Props) {
    return (
        <button
            class={`${classes ?? ''} flex justify-center items-center rounded-[50%] w-16 h-16 bg-neutral-600 cursor-pointer transition ease-out duration-10 origin-center hover:scale-[1.1] hover:bg-neutral-900 focus:scale-[1.05] focus:bg-neutral-800`}
            onClick={callback}
        >
            <span class='text-white font-bold text-[4rem] leading-4 h-8'>&times;</span>
        </button>
    );
}
