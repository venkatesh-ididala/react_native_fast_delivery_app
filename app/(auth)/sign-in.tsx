import { router } from 'expo-router'
import React from 'react'
import { Button, Text, View } from 'react-native'

const SignIn = () => {
  return (
        <View>
            <Text>
                Sign In
            </Text>
            <Button title='Sign in ' onPress={()=> router.push("/sign-up")} />
        </View>
  )
}

export default SignIn