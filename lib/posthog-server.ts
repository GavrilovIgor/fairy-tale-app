import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

export function getPostHog(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return _client
}
