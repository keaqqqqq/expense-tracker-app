const Button = ({children, className, primary, secondary, ...rest}) =>{
    
    const defaultClassName = "px-3 mx-3 py-1 my-3 rounded " + (primary?"bg-indigo-700 text-white hover:bg-indigo-800 ":secondary?"bg-indigo-100 text-indigo-700 hover:bg-indigo-200 ":"")
    const finalClassName = defaultClassName + className;
    return (
        <button className={finalClassName} {...rest}>{children}</button>
    )
}

export default Button;