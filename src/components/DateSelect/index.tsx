import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import styles from "./index.module.scss";

const days = ["일", "월", "화", "수", "목", "금", "토"];

const getDate = (startDate: Date, daysToAdd: number): number[][] => {
  let result = [];
  for (let i = 0; i < Math.abs(daysToAdd); i++) {
    const d_today = new Date(startDate);
    d_today.setDate(startDate.getDate() + (daysToAdd > 0 ? i : -i));
    let date = d_today.getDate();
    let day = d_today.getDay();

    let data = [date, day];
    result.push(data);
  }
  return daysToAdd > 0 ? result : result.reverse();
};

export const DateSelect = ({ className }: { className: string }) => {
  const today = new Date();
  const initialDates = getDate(new Date(Date.now() - 5 * 86400000), 12);

  const todayIndex = initialDates.findIndex(
    (date) => date[0] === today.getDate() && date[1] === today.getDay()
  );

  const [data, setData] = useState(initialDates);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(todayIndex);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;

      const dateItem = container.querySelector(`.${styles.dateItem}`);
      if (dateItem) {
        const itemWidth = dateItem.clientWidth;
        const containerWidth = container.clientWidth;
        const scrollPosition =
          (itemWidth * data.length) / 2 - containerWidth / 2;
        container.scrollLeft = scrollPosition;
      }

      const handleScroll = () => {
        if (!hasScrolled) {
          setHasScrolled(true);
        }
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const loadMoreDates = (direction: "start" | "end") => {
    if (!hasScrolled) return;

    if (direction === "start") {
      const firstDate = new Date();
      firstDate.setDate(firstDate.getDate() - data.length + 5);
      let newDates = getDate(firstDate, -3);

      // Store current scroll position
      const container = scrollContainerRef.current;
      if (container) {
        const dateItem = container.querySelector(`.${styles.dateItem}`);
        if (dateItem) {
          const itemWidth = dateItem.clientWidth;
          const prevScrollLeft = container.scrollLeft;

          // Adjust scroll position after render
          requestAnimationFrame(() => {
            container.scrollTo({
              left: prevScrollLeft + itemWidth * 3,
              behavior: "instant" as ScrollBehavior,
            });
          });

          // Update data and selectedIndex in one batch
          setData([...newDates, ...data]);
          setSelectedIndex(selectedIndex + 3);
        }
      }
    } else {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() + data.length - 4);
      let newDates = getDate(lastDate, 3);
      setData([...data, ...newDates]);
    }
  };

  const { ref: startRef, inView: startInView } = useInView({});
  const { ref: endRef, inView: endInView } = useInView({});

  useLayoutEffect(() => {
    if (startInView) {
      loadMoreDates("start");
    }
  }, [startInView]);

  useLayoutEffect(() => {
    if (endInView) {
      loadMoreDates("end");
    }
  }, [endInView]);

  return (
    <div
      className={`${styles.scrollContainer} ${className}`}
      ref={scrollContainerRef}
    >
      <div className={styles.dateList}>
        {data.map((date, index) => (
          <div
            key={index}
            className={`${styles.dateItem} ${
              selectedIndex === index ? styles.selected : ""
            }`}
            onClick={() => setSelectedIndex(index)}
            ref={
              index === 0 ? startRef : index === data.length - 1 ? endRef : null
            }
          >
            <div className="p-md pt-sm pb-sm">
              <p className="typo-subTitle">{days[date[1]]}</p>
              <span className="typo-header2">{date[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
