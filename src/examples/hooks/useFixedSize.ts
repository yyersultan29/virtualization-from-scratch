import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Key, UseFixedSizeListProps } from "../types";

export const DEFAULT_OVERSCAN = 3;
export const DEFAULT_SCROLLING_DELAY = 150;
export const containerHeight = 600;

function validateProps(props: UseFixedSizeListProps) {
  const { itemHeight, estimateItemHeight } = props;
  if (!itemHeight && !estimateItemHeight) {
    throw new Error(
      `you must pass either "itemHeight" or "estimateItemHeight" props `
    );
  }
}

export function useFixedSizeList(props: UseFixedSizeListProps) {
  validateProps(props);

  const {
    itemHeight, // каждому элементу пока +- 10пх разницы
    itemsCount, // just length of all list
    estimateItemHeight,
    getItemKey,

    scrollingDelay = DEFAULT_SCROLLING_DELAY, // поставить флажок на false через некоторый минуты
    overscan = DEFAULT_OVERSCAN, // добавить лишний элементы на массив
    getScrollElement, // () => get Box element where scrols
  } = props;

  const [measurementCahce, setMeasurementCache] = useState<Record<Key, number>>(
    {}
  );
  const [listHeight, setListHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Get height of scrollElement;
  useLayoutEffect(() => {
    // ТУТ ПОЛУЧАЕМ HEIGHT OF SCROLL ELEMENT

    const scrollElement = getScrollElement();
    if (!scrollElement) {
      return;
    }

    //тут мы подписываемся на изменения ширины scroll Element - а

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      const height =
        entry.borderBoxSize[0]?.blockSize ??
        entry.target.getBoundingClientRect().height;

      setListHeight(height);
    });

    resizeObserver.observe(scrollElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [getScrollElement]);

  // set Scroll Top pixels;
  useLayoutEffect(() => {
    const scrollElement = getScrollElement();

    if (!scrollElement) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;

      setScrollTop(scrollTop);
    };
    handleScroll();

    scrollElement.addEventListener("scroll", handleScroll);

    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [getScrollElement]);

  // check is scrolling
  useEffect(() => {
    const scrollElement = getScrollElement();

    if (!scrollElement) {
      return;
    }

    let timeoutId: number | null = null;

    const handleScroll = () => {
      setIsScrolling(true);

      if (typeof timeoutId === "number") {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    };

    scrollElement.addEventListener("scroll", handleScroll);

    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [getScrollElement]);

  const { virtaulItems, startIndex, endIndex, totalHeight, allItems } =
    useMemo(() => {
      const getItemHeight = (index: number) => {
        if (itemHeight) {
          return itemHeight(index);
        }
        const key = getItemKey(index);
        if (typeof measurementCahce[key] === "number") {
          return measurementCahce[key]!;
        }
        return estimateItemHeight!(index);
      };

      const rangeStart = scrollTop; // window top
      const rangeEnd = scrollTop + containerHeight; // window end

      let totalHeight = 0; // all list items height
      let startIndex = -1; // показать будем меньше типа 3.2 = 3 лучше показать больше
      let endIndex = -1; // тоже самое больше элементов на один

      const allRows = Array(itemsCount);

      // iterate all list items to set each item offsetTop ( translateY(...px) )
      for (let index = 0; index < itemsCount; index++) {
        const key = getItemKey(index);
        const row = {
          key,
          index: index,
          height: getItemHeight(index),
          offsetTop: totalHeight,
        };

        totalHeight += row.height;
        allRows[index] = row;

        if (startIndex === -1 && row.offsetTop + row.height > rangeStart) {
          startIndex = Math.max(0, index - overscan);
        }

        if (endIndex === -1 && row.offsetTop + row.height >= rangeEnd) {
          endIndex = Math.min(itemsCount - 1, index + overscan);
        }
      }
      const virtualRows = allRows.slice(startIndex, endIndex + 1);

      return {
        virtaulItems: virtualRows,
        startIndex,
        endIndex,
        allItems: allRows,
        totalHeight,
      };
    }, [
      scrollTop,
      listHeight,
      itemsCount,
      estimateItemHeight,
      overscan,
      measurementCahce,
    ]);

  const measureElement = useCallback((element: Element | null) => {
    if (!element) {
      return;
    }

    const indexAttribute = element?.getAttribute("data-index") || "";
    const index = parseInt(indexAttribute, 10);

    if (Number.isNaN(index)) {
      console.error(
        "dynamic elements must have a valid `data-index` attribute"
      );
      return;
    }

    const size = element.getBoundingClientRect();

    const key = getItemKey(index);
    setMeasurementCache((cache) => ({ ...cache, [key]: size.height }));
  }, []);

  return {
    virtaulItems,
    totalHeight,
    startIndex,
    endIndex,
    isScrolling,
    allItems,
    measureElement,
  };
}
