import {Link} from '@remix-run/react';
import type {BtnColorValue} from "~/components/colorbutton";
import ColorButton from "~/components/colorbutton";

export default function Back({ to, color }: {to: string, color: BtnColorValue}) {
  return (
    <Link to={to} className="text-white focus:ring-4 focus:outline-none rounded-lg text-center inline-flex gap-2 items-centerrounded-md text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
      <ColorButton color={color}>
        <svg aria-hidden="true" className="w-5 h-5 -ml-1" style={{ transform: 'scale(-1,1)' }} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
        Back
      </ColorButton>
    </Link>
  );
}
