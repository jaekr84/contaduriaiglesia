import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Noto Sans KR',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112233',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#666666',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#112233',
        marginBottom: 10,
        backgroundColor: '#f3f4f6',
        padding: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f9fafb',
        marginHorizontal: 5,
        borderRadius: 4,
    },
    statLabel: {
        fontSize: 10,
        color: '#666666',
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#112233',
    },
    statValuePositive: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10b981', // green-500
    },
    statValueNegative: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ef4444', // red-500
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#bfbfbf',
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
    },
    tableCol: {
        width: '33.33%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#bfbfbf',
        padding: 5,
    },
    tableColSmall: {
        width: '20%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#bfbfbf',
        padding: 5,
    },
    tableColLarge: {
        width: '40%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#bfbfbf',
        padding: 5,
    },
    tableCell: {
        fontSize: 10,
        color: '#333333',
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#112233',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 10,
        color: '#9ca3af',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 10,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'grey',
    },
})
