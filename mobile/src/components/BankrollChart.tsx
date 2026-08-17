import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import type { BankrollPoint } from "@paristats/shared";
import { formatCurrency } from "../utils/format";

const VIEW_WIDTH = 320;

export function BankrollChart({ data, height = 160 }: { data: BankrollPoint[]; height?: number }) {
  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Pas encore assez de données</Text>
      </View>
    );
  }

  const values = data.map((d) => d.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = data.length > 1 ? VIEW_WIDTH / (data.length - 1) : 0;

  const points = data.map((point, i) => ({
    x: i * stepX,
    y: height - ((point.balance - min) / range) * height,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const areaPath = `${linePath} L${last.x.toFixed(1)},${height} L0,${height} Z`;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_WIDTH} ${height}`}>
        <Defs>
          <LinearGradient id="bankrollFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6366f1" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#6366f1" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#bankrollFill)" stroke="none" />
        <Path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2} />
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Min {formatCurrency(min)}</Text>
        <Text style={styles.legendText}>Max {formatCurrency(max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  legendText: {
    color: "#64748b",
    fontSize: 11,
  },
});
