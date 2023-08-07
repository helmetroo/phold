import ChosenFile from './chosen-file';

type Callback = () => void;
export default Callback;

type PromisedCallback = () => Promise<void>;
type BoolCallback = (b: boolean) => void;
type FileCallback = (f: ChosenFile) => void;
type NumCallback = (value: number) => void;
export type {
    PromisedCallback,
    BoolCallback,
    FileCallback,
    NumCallback,
};
