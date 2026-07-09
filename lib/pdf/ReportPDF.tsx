import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 36, color: '#1f2937' },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#6b7280' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '8 8', borderRadius: 3 },
  headerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  cellText: { fontSize: 9, color: '#1f2937' },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 8, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

interface Props {
  title: string
  subtitle: string
  columns: string[]
  rows: string[][]
}

export default function ReportPDF({ title, subtitle, columns, rows }: Props) {
  const colFlex = columns.map((_, i) => (i === 0 ? 2 : 1))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {columns.map((col, i) => (
              <Text key={col} style={[styles.headerText, { flex: colFlex[i] }]}>{col}</Text>
            ))}
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.tableRow}>
              {row.map((cell, ci) => (
                <Text key={ci} style={[styles.cellText, { flex: colFlex[ci] }]}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>Akoben Event Rentals • Cape Coast, Ghana • Generated {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  )
}
