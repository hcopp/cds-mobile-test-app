import { useRef, useState, memo, useMemo, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View } from 'react-native';

import { ThemeProvider, useTheme} from '@coinbase/cds-mobile';
import { defaultTheme } from '@coinbase/cds-mobile/themes/defaultTheme';

import { Button } from '@coinbase/cds-mobile/buttons/Button';
import { ChartBridgeProvider, LineChart, Scrubber } from '@coinbase/cds-mobile-visualization';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultAxisTickLabel, CartesianChart, YAxis, Line, DottedArea, SolidLine, useCartesianChartContext, projectPointWithSerializableScale, unwrapAnimatedValue, buildTransition, defaultTransition } from '@coinbase/cds-mobile-visualization';
import {
  sparklineInteractiveData,
} from '@coinbase/cds-common/internal/visualizations/SparklineInteractiveData';

import { useSharedValue, useDerivedValue, useAnimatedReaction } from 'react-native-reanimated';
import { Skia, Circle, FontWeight, TextAlign } from '@shopify/react-native-skia';

export default function App() {
  const scrubberRef = useRef(null);
  const [isIdlePulse, setIsIdlePulse] = useState(true);

  return (
    <GestureHandlerRootView>
      <ChartBridgeProvider>
        <ThemeProvider activeColorScheme="light" theme={defaultTheme}>
          <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <LineChart
              enableScrubbing
              showArea
              height={200}
              series={[
                {
                  id: 'prices',
                  data: [10, 22, 29, 45, 98, 45, 22, 52, 21, 4, 68, 20, 21, 58],
                  color: 'red'
                },
              ]}
            >
              <Scrubber idlePulse={isIdlePulse} />
            </LineChart>
            <Button onPress={() => setIsIdlePulse(!isIdlePulse)}>{isIdlePulse ? 'Stop' : 'Start'}</Button>
            <LineChart
              enableScrubbing
              showArea
              height={200}
              series={[
                {
                  id: 'prices',
                  data: [10, 22, 29, 45, 98, 45, 22, 52, 21, 4, 68, 20, 21, 58],
                  color: 'red'
                },
              ]}
            >
              <Scrubber ref={scrubberRef} />
            </LineChart>
            <Button onPress={() => scrubberRef.current?.pulse()}>Pulse</Button>
            <MonotoneAssetPrice />
          </View>
        </ThemeProvider>
      </ChartBridgeProvider>
    </GestureHandlerRootView>
  );
}

function MonotoneAssetPrice() {
  const theme = useTheme();
  const prices = sparklineInteractiveData.hour;

  const fontMgr = useMemo(() => {
    const fontProvider = Skia.TypefaceFontProvider.Make();
    // Register system fonts if available, otherwise Skia will use defaults
    return fontProvider;
  }, []);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
    [],
  );

  const scrubberPriceFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const formatPrice = useCallback(
    (price) => {
      return priceFormatter.format(price);
    },
    [priceFormatter],
  );

  const formatDate = useCallback((date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });

    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dayOfWeek}, ${monthDay}, ${time}`;
  }, []);

  const scrubberLabel = useCallback(
    (index) => {
      const price = scrubberPriceFormatter.format(prices[index].value);
      const date = formatDate(prices[index].date);

      const regularStyle = {
        fontFamilies: ['Inter'],
        fontSize: 14,
        fontStyle: {
          weight: FontWeight.Normal,
        },
        color: Skia.Color(theme.color.fgMuted),
      };

      const boldStyle = {
        fontFamilies: ['Inter'],
        ...regularStyle,
        fontStyle: {
          weight: FontWeight.Bold,
        },
      };

      const builder = Skia.ParagraphBuilder.Make(
        {
          textAlign: TextAlign.Left,
        },
        fontMgr,
      );

      builder.pushStyle(boldStyle);
      builder.addText(`${price} USD`);

      builder.pushStyle(regularStyle);
      builder.addText(` ${date}`);

      const para = builder.build();
      para.layout(512);
      return para;
    },
    [scrubberPriceFormatter, prices, formatDate, theme.color.fgMuted, fontMgr],
  );

  const formatAxisLabelPrice = useCallback(
    (price) => {
      return formatPrice(price);
    },
    [formatPrice],
  );

  // Custom tick label component with offset positioning
  const CustomYAxisTickLabel = useCallback(
    (props) => <DefaultAxisTickLabel {...props} dx={4} dy={-12} horizontalAlignment="left" />,
    [],
  );

  const CustomScrubberBeacon = memo(
    forwardRef(({ dataX, dataY, seriesId, isIdle, animate = true }, ref) => {
      const { getSeries, getXSerializableScale, getYSerializableScale } =
        useCartesianChartContext();

      const targetSeries = useMemo(() => getSeries(seriesId), [getSeries, seriesId]);
      const xScale = useMemo(() => getXSerializableScale(), [getXSerializableScale]);
      const yScale = useMemo(
        () => getYSerializableScale(targetSeries?.yAxisId),
        [getYSerializableScale, targetSeries?.yAxisId],
      );

      const animatedX = useSharedValue(0);
      const animatedY = useSharedValue(0);

      // Provide a no-op pulse implementation for simple beacons
      useImperativeHandle(ref, () => ({ pulse: () => {} }), []);

      // Calculate the target point position - project data to pixels
      const targetPoint = useDerivedValue(() => {
        if (!xScale || !yScale) return { x: 0, y: 0 };
        return projectPointWithSerializableScale({
          x: unwrapAnimatedValue(dataX),
          y: unwrapAnimatedValue(dataY),
          xScale,
          yScale,
        });
      }, [dataX, dataY, xScale, yScale]);

      useAnimatedReaction(
        () => {
          return { point: targetPoint.value, isIdle: unwrapAnimatedValue(isIdle) };
        },
        (current, previous) => {
          // When animation is disabled, on initial render, or when we are starting,
          // continuing, or finishing scrubbing we should immediately transition
          if (!animate || previous === null || !previous.isIdle || !current.isIdle) {
            animatedX.value = current.point.x;
            animatedY.value = current.point.y;
            return;
          }

          animatedX.value = buildTransition(current.point.x, defaultTransition);
          animatedY.value = buildTransition(current.point.y, defaultTransition);
        },
        [animate],
      );

      // Create animated point using the animated values
      const animatedPoint = useDerivedValue(() => {
        return { x: animatedX.value, y: animatedY.value };
      }, [animatedX, animatedY]);

      return (
        <>
          <Circle c={animatedPoint} color={theme.color.bg} r={5} />
          <Circle c={animatedPoint} color={theme.color.fg} r={5} strokeWidth={3} style="stroke" />
        </>
      );
    }),
  );

  return (
    <LineChart
      enableScrubbing
      showYAxis
      height={200}
      inset={{ top: 64 }}
      series={[
        {
          id: 'btc',
          data: prices.map((price) => price.value),
          color: theme.color.fg,
          gradient: {
            axis: 'x',
            stops: ({ min }) => [
              { offset: min, color: theme.color.fg, opacity: 0 },
              { offset: 32, color: theme.color.fg, opacity: 1 },
            ],
          },
        },
      ]}
      xAxis={{
        range: ({ max }) => ({ min: 96, max }),
      }}
      yAxis={{
        position: 'left',
        width: 0,
        showGrid: true,
        tickLabelFormatter: formatAxisLabelPrice,
        TickLabelComponent: CustomYAxisTickLabel,
      }}
    >
      <Scrubber
        labelElevated
        hideOverlay
        BeaconComponent={CustomScrubberBeacon}
        LineComponent={SolidLine}
        label={scrubberLabel}
      />
    </LineChart>
  );
}

/*function Transitions() {
  const theme = useTheme();
  const dataCount = 20;
  const maxDataOffset = 15000;
  const minStepOffset = 2500;
  const maxStepOffset = 10000;
  const domainLimit = 20000;
  const updateInterval = 500;

  const myTransitionConfig = { type: 'spring', stiffness: 700, damping: 20 };
  const negativeColor = `rgb(${theme.spectrum.gray15})`;
  const positiveColor = theme.color.fgPositive;

  function generateNextValue(previousValue) {
    const range = maxStepOffset - minStepOffset;
    const offset = Math.random() * range + minStepOffset;

    let direction;
    if (previousValue >= maxDataOffset) {
      direction = -1;
    } else if (previousValue <= -maxDataOffset) {
      direction = 1;
    } else {
      direction = Math.random() < 0.5 ? -1 : 1;
    }

    let newValue = previousValue + offset * direction;
    newValue = Math.max(-maxDataOffset, Math.min(maxDataOffset, newValue));
    return newValue;
  }

  function generateInitialData() {
    const data = [];

    let previousValue = Math.random() * 2 * maxDataOffset - maxDataOffset;
    data.push(previousValue);

    for (let i = 1; i < dataCount; i++) {
      const newValue = generateNextValue(previousValue);
      data.push(newValue);
      previousValue = newValue;
    }

    return data;
  }

  const MyGradient = memo((props) => {
    const areaGradient = {
      stops: ({ min, max }) => [
        { offset: min, color: negativeColor, opacity: 1 },
        { offset: 0, color: negativeColor, opacity: 0 },
        { offset: 0, color: positiveColor, opacity: 0 },
        { offset: max, color: positiveColor, opacity: 1 },
      ],
    };

    return <DottedArea {...props} gradient={areaGradient} />;
  });

  function CustomTransitionsChart() {
    const [data, setData] = useState(generateInitialData);

    useEffect(() => {
      const intervalId = setInterval(() => {
        setData((currentData) => {
          const lastValue = currentData[currentData.length - 1] ?? 0;
          const newValue = generateNextValue(lastValue);

          return [...currentData.slice(1), newValue];
        });
      }, updateInterval);

      return () => clearInterval(intervalId);
    }, []);

    const tickLabelFormatter = useCallback(
      (value) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value),
      [],
    );

    const valueAtIndexFormatter = useCallback(
      (dataIndex) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(data[dataIndex]),
      [data],
    );

    const lineGradient = {
      stops: [
        { offset: 0, color: negativeColor },
        { offset: 0, color: positiveColor },
      ],
    };

    return (
      <CartesianChart
        enableScrubbing
        height={200}
        inset={{ top: 32, bottom: 32, left: 16, right: 16 }}
        series={[
          {
            id: 'prices',
            data: data,
            gradient: lineGradient,
          },
        ]}
        yAxis={{ domain: { min: -domainLimit, max: domainLimit } }}
      >
        <YAxis showGrid requestedTickCount={2} tickLabelFormatter={tickLabelFormatter} />
        <Line
          showArea
          AreaComponent={MyGradient}
          seriesId="prices"
          strokeWidth={3}
          transition={myTransitionConfig}
        />
        <Scrubber
          hideOverlay
          beaconTransitions={{ update: myTransitionConfig }}
          label={valueAtIndexFormatter}
        />
      </CartesianChart>
    );
  }

  return <CustomTransitionsChart />;
}*/
function MissingData() {
  const theme = useTheme();
  const pages = ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F', 'Page G'];
  const pageViews = [2400, 1398, null, 3908, 4800, 3800, 4300];
  const uniqueVisitors = [4000, 3000, null, 2780, 1890, 2390, 3490];

  const numberFormatter = useCallback(
    (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value),
    [],
  );

  return (
    <LineChart
      enableScrubbing
      showArea
      showXAxis
      showYAxis
      height={200}
      // You can render points at every valid data point by always returning true
      points
      series={[
        {
          id: 'pageViews',
          data: pageViews,
          color: theme.color.accentBoldGreen,
          // Label will render next to scrubber beacon
          label: 'Page Views',
          connectNulls: true,
        },
        {
          id: 'uniqueVisitors',
          data: uniqueVisitors,
          color: theme.color.accentBoldPurple,
          label: 'Unique Visitors',
        },
      ]}
      xAxis={{
        // Used on the x-axis to provide context for each index from the series data array
        data: pages,
      }}
      yAxis={{
        showGrid: true,
        tickLabelFormatter: numberFormatter,
      }}
    >
      {/* We can offset the overlay to account for the points being drawn on the lines */}
      <Scrubber overlayOffset={6} />
    </LineChart>
  );
}