export type ScreenSkeletonLayout = "home" | "card" | "exercise" | "collection";

export interface ScreenSkeletonProps {
  layout: ScreenSkeletonLayout;
}

const block = "rounded-card border-[2.5px] border-ink bg-card";
const line = "block rounded-chip bg-canvas";

export function ScreenSkeleton({ layout }: ScreenSkeletonProps) {
  return (
    <div className="flex h-full flex-col motion-safe:animate-pulse" aria-hidden="true">
      {layout === "home" ?
      <>
          <span className={`${line} h-8 w-1/2`} />
          <span className={`${line} mt-3 h-4 w-2/3`} />
          <div className={`${block} mt-6 h-44 p-5`}>
            <span className={`${line} h-4 w-1/3`} />
            <span className={`${line} mt-3 h-8 w-3/4`} />
            <span className="mt-6 block h-14 rounded-full border-[2.5px] border-ink bg-canvas" />
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) =>
          <span key={item} className={`${block} block h-16`} />
          )}
          </div>
        </> :
      null}

      {layout === "card" ?
      <>
          <div className={`${block} h-[380px] p-5`}>
            <span className="block h-14 w-14 rounded-full border-[2.5px] border-ink bg-canvas" />
            <span className={`${line} mt-5 h-14 w-1/2`} />
            <span className={`${line} mt-2 h-5 w-1/4`} />
            <span className={`${line} mt-5 h-11 w-1/3`} />
            <span className={`${line} mt-4 h-20 w-full`} />
            <span className="mt-6 block border-t-[2.5px] border-ink" />
            <span className={`${line} mt-5 h-6 w-5/6`} />
          </div>
          <span className={`${line} mt-6 h-6 w-1/3`} />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((item) =>
          <span key={item} className={`${line} h-11 w-20`} />
          )}
          </div>
        </> :
      null}

      {layout === "exercise" ?
      <>
          <div className="flex items-center justify-between">
            <span className={`${line} h-11 w-32`} />
            <div className="flex gap-2">
              {[0, 1, 2].map((item) =>
            <span key={item} className="h-4 w-12 rounded-chip border-2 border-ink bg-card" />
            )}
            </div>
          </div>
          <span className={`${line} mt-5 h-8 w-2/3`} />
          <span className={`${block} mt-5 block h-36`} />
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((item) =>
          <span key={item} className={`${block} block h-16`} />
          )}
          </div>
        </> :
      null}

      {layout === "collection" ?
      <>
          <span className={`${line} h-8 w-1/2`} />
          <div className="mt-5 flex gap-2">
            {[0, 1, 2].map((item) =>
          <span key={item} className={`${line} h-11 w-24`} />
          )}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((item) =>
          <span key={item} className={`${block} block h-32`} />
          )}
          </div>
        </> :
      null}

      <span className="action-width mt-auto block h-14 rounded-full border-[2.5px] border-ink bg-canvas" />
    </div>);

}