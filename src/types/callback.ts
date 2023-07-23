import ChosenFile from './chosen-file';

type Callback = () => void;
export default Callback;

type FileCallback = (f: ChosenFile) => void;
export type {
    FileCallback
};
