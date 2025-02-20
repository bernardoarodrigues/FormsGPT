import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";
import { BotIcon, Plus } from "lucide-react"

export const Header = ({title}) => {
  return (
    <>
      <header className="flex items-center justify-between px-2 sm:px-4 py-2 bg-background text-black dark:text-white w-full">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <ThemeToggle />
        </div>
        {title && <div className="flex justify-center space-x-1 sm:space-x-2">
          <BotIcon size={27}/>
          <h2 className="text-lg font-bold">FormsGPT</h2>
        </div>}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            className="bg-background border border-gray text-gray-600 hover:white dark:text-gray-200 h-10"
            onClick={()=>location.reload()}
          >
            <Plus className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">New chat</span>
          </Button>
        </div>
      </header>
    </>
  );
};