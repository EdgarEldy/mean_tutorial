export interface GraphQlError {
  message: string;
}

// A GraphQL-over-HTTP response can carry both data and errors, or errors with no data at all
// (a resolver threw), even on a 200 status, unlike the REST ApiResponse envelope.
export interface GraphQlResponse<T> {
  data?: T;
  errors?: GraphQlError[];
}
