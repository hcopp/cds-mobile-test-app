// import { useRef } from 'react';
import { View } from 'react-native';

import { ThemeProvider } from '@coinbase/cds-mobile';
import { defaultTheme } from '@coinbase/cds-mobile/themes/defaultTheme';

import { Button } from '@coinbase/cds-mobile/buttons/Button';
import { ChartBridgeProvider, LineChart, Scrubber } from '@coinbase/cds-mobile-visualization';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
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
              <Scrubber idlePulse />
            </LineChart>
          </View>
        </ThemeProvider>
      </ChartBridgeProvider>
    </GestureHandlerRootView>
  );
}
