
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';

const App = () => {
    return (
        <SafeAreaView>
            <View>
                <Text>{Date()}</Text>
            </View>
        </SafeAreaView>
    )
}

export default App;