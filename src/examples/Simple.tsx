import { useCallback, useRef, useState } from "react";

import { faker } from "@faker-js/faker";

import { useFixedSizeList } from "./hooks/useFixedSize";

const items = Array.from({ length: 10_000 }, (_, index) => ({
  id: Math.random().toString(36).slice(2),
  text: faker.lorem.text()
}));

export const itemHeight = 40;
export const containerHeight = 600;

export function Simple() {

  const [listItems, setListItems] = useState(items);

  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { virtaulItems, totalHeight: totalListHeight, measureElement } = useFixedSizeList({

    // itemHeight: () => 40 + Math.round(10 * Math.random()),
    estimateItemHeight: useCallback(() => 40, []),
    itemsCount: listItems.length,
    getScrollElement: useCallback(() => scrollElementRef.current, []),
    getItemKey: useCallback((index) => listItems[index]!.id, [])

  })

  return (
    <div style={{ padding: "0 12px" }}>

      <h1>List</h1>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => setListItems((items) => items.slice().reverse())}
        >
          reverse
        </button>
      </div>

      <div
        ref={scrollElementRef}
        style={{
          height: containerHeight,
          overflow: 'auto',
          border: "1px solid lightgrey",
          position: "relative"
        }}
      >
        <div style={{ height: totalListHeight }}>
          {virtaulItems.map((virtaulItem) => {
            const item = listItems[virtaulItem.index]!;
            return (
              <div
                key={item.id}
                data-index={virtaulItem.index}
                ref={measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${virtaulItem.offsetTop}px)`,
                  padding: "6px 12px"
                }}
              >
                {item.text}
              </div>
            )
          })}
        </div>


      </div>

    </div>
  )

}