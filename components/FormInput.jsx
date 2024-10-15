import { Input } from "@headlessui/react";

export default function FormInput({children, className, ...rest}){
    const defaultClassName = "border rounded focus:outline-indigo-500 m-2 p-2 "
    return (
        <Input className={defaultClassName+className} {...rest}>{children}</Input>
    )
}